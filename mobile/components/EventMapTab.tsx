import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
  FlatList,
  Image,
} from 'react-native';
import MapView, { Marker, Callout, Region } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { EventMap, EventMapLocation } from '../types';
import { useThemeColors } from '../hooks/useThemeColors';
import { t } from '../lib/i18n';

// Custom Marker Component
const CustomMarker = ({
  location,
  onPress,
  onCalloutPress,
  colors,
}: {
  location: EventMapLocation;
  onPress: () => void;
  onCalloutPress: () => void;
  colors: any;
}) => {
  return (
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
      title={location.name}
      description={location.description || location.address || undefined}
      onPress={onPress}
      onCalloutPress={onCalloutPress}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: colors.primary,
          borderWidth: 2,
          borderColor: 'white',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {location.image ? (
          <Image
            source={{ uri: location.image }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
            }}
            resizeMode='cover'
          />
        ) : (
          <Feather name='map-pin' size={16} color='white' />
        )}
      </View>
    </Marker>
  );
};

interface EventMapTabProps {
  eventMap: EventMap | null;
  isLoading?: boolean;
  error?: any;
}

export default function EventMapTab({
  eventMap,
  isLoading,
  error,
}: EventMapTabProps) {
  const { colors } = useThemeColors();
  const [userLocation, setUserLocation] =
    useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<EventMapLocation | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [showListView, setShowListView] = useState(false);

  // Request location permission and get user location
  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation(location);
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    requestLocationPermission();
  }, []);

  // Calculate map region when eventMap or userLocation changes
  useEffect(() => {
    if (!eventMap || !eventMap.locations.length) return;

    const locations = eventMap.locations.filter((loc) => loc.is_active);
    if (locations.length === 0) return;

    if (locations.length === 1) {
      // Single location - center on it
      setMapRegion({
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } else {
      // Multiple locations - fit all in view
      const latitudes = locations.map((loc) => loc.latitude);
      const longitudes = locations.map((loc) => loc.longitude);

      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);
      const minLng = Math.min(...longitudes);
      const maxLng = Math.max(...longitudes);

      const latDelta = Math.max(maxLat - minLat, 0.01) * 1.2; // Add some padding
      const lngDelta = Math.max(maxLng - minLng, 0.01) * 1.2;

      setMapRegion({
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: latDelta,
        longitudeDelta: lngDelta,
      });
    }
  }, [eventMap]);

  const handleLocationPress = async (location: EventMapLocation) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocation(location);
  };

  const handleDirectionsPress = async (location: EventMapLocation) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const { latitude, longitude, address, name } = location;
    const destination = address || `${latitude},${longitude}`;

    const url = `https://maps.apple.com/?daddr=${encodeURIComponent(
      destination
    )}&dirflg=d`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t('errorTitle'), t('cannotOpenMaps'));
      }
    } catch (error) {
      console.error('Error opening maps:', error);
      Alert.alert(t('errorTitle'), t('cannotOpenMaps'));
    }
  };

  const handleCalloutPress = (location: EventMapLocation) => {
    setSelectedLocation(location);
  };

  const handleListItemPress = async (location: EventMapLocation) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedLocation(location);
    setShowListView(false);

    // Center map on selected location
    setMapRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const toggleListView = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowListView(!showListView);
  };

  if (isLoading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <Text
          style={{ color: colors.mutedForeground }}
          className='font-grotesk text-sm'
        >
          {t('loadingMap')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className='flex-1 justify-center items-center px-6'>
        <Text
          style={{ color: colors.mutedForeground }}
          className='font-grotesk text-sm text-center'
        >
          {t('failedToLoadMap')}
        </Text>
      </View>
    );
  }

  if (!eventMap || !eventMap.locations.length) {
    return (
      <View className='flex-1 justify-center items-center px-6'>
        <Feather name='map-pin' size={48} color={colors.mutedForeground} />
        <Text
          style={{ color: colors.mutedForeground }}
          className='font-grotesk text-sm text-center mt-4'
        >
          {t('noMapAvailable')}
        </Text>
      </View>
    );
  }

  const activeLocations = eventMap.locations.filter((loc) => loc.is_active);

  return (
    <View className='flex-1'>
      {/* Toggle Button */}
      <View className='absolute top-12 right-4 z-10'>
        <TouchableOpacity
          onPress={toggleListView}
          className='p-3 rounded-full'
          style={{
            backgroundColor: colors.background,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Feather
            name={showListView ? 'map' : 'list'}
            size={20}
            color={colors.foreground}
          />
        </TouchableOpacity>
      </View>

      {/* Map or List View */}
      {showListView ? (
        <View className='flex-1'>
          <View
            className='px-4 py-3 border-b'
            style={{ borderBottomColor: colors.border }}
          >
            <Text
              style={{ color: colors.foreground }}
              className='font-semibold text-lg'
            >
              {eventMap.title}
            </Text>
            <Text
              style={{ color: colors.mutedForeground }}
              className='text-sm mt-1'
            >
              {activeLocations.length}{' '}
              {activeLocations.length === 1 ? t('location') : t('locations')}
            </Text>
          </View>
          <FlatList
            data={activeLocations}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleListItemPress(item)}
                className='px-4 py-3 border-b'
                style={{
                  borderBottomColor: colors.border,
                  backgroundColor:
                    selectedLocation?.id === item.id
                      ? colors.muted
                      : 'transparent',
                }}
              >
                <View className='flex-row items-center'>
                  {/* Order Number */}
                  <View
                    className='w-8 h-8 rounded-full mr-3 items-center justify-center'
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text
                      style={{ color: 'white' }}
                      className='font-semibold text-sm'
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Location Image or Icon */}
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className='w-12 h-12 rounded-lg mr-3'
                      style={{
                        backgroundColor: colors.muted,
                        maxWidth: 48,
                        maxHeight: 48,
                        resizeMode: 'cover',
                      }}
                    />
                  ) : (
                    <View
                      className='w-12 h-12 rounded-lg mr-3 items-center justify-center'
                      style={{ backgroundColor: colors.muted }}
                    >
                      <Feather
                        name='map-pin'
                        size={20}
                        color={colors.mutedForeground}
                      />
                    </View>
                  )}
                  <View className='flex-1'>
                    <Text
                      style={{ color: colors.foreground }}
                      className='font-semibold text-base'
                    >
                      {item.name}
                    </Text>
                    {item.description && (
                      <Text
                        style={{ color: colors.mutedForeground }}
                        className='text-sm mt-1'
                      >
                        {item.description}
                      </Text>
                    )}
                    {item.address && (
                      <Text
                        style={{ color: colors.mutedForeground }}
                        className='text-xs mt-1'
                      >
                        {item.address}
                      </Text>
                    )}
                  </View>
                  <Feather
                    name='chevron-right'
                    size={16}
                    color={colors.mutedForeground}
                  />
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      ) : (
        <View className='flex-1'>
          {mapRegion && (
            <MapView
              style={{ flex: 1 }}
              region={mapRegion}
              showsUserLocation={!!userLocation}
              showsMyLocationButton={false}
              showsCompass={false}
              showsScale={false}
              showsBuildings={true}
              showsIndoors={true}
              mapType='standard'
            >
              {activeLocations.map((location, index) => (
                <CustomMarker
                  key={location.id}
                  location={location}
                  onPress={() => handleLocationPress(location)}
                  onCalloutPress={() => handleCalloutPress(location)}
                  colors={colors}
                />
              ))}
            </MapView>
          )}
        </View>
      )}

      {/* Location Details Modal */}
      {selectedLocation && (
        <View
          className='absolute bottom-0 left-0 right-0 p-4'
          style={{
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <View className='flex-row items-start justify-between'>
            <View className='flex-1 mr-3'>
              <Text
                style={{ color: colors.foreground }}
                className='font-semibold text-base'
              >
                {selectedLocation.name}
              </Text>
              {selectedLocation.description && (
                <Text
                  style={{ color: colors.mutedForeground }}
                  className='text-sm mt-1'
                >
                  {selectedLocation.description}
                </Text>
              )}
              {selectedLocation.address && (
                <Text
                  style={{ color: colors.mutedForeground }}
                  className='text-xs mt-1'
                >
                  {selectedLocation.address}
                </Text>
              )}
            </View>
            <View className='flex-row gap-2'>
              <TouchableOpacity
                onPress={() => setSelectedLocation(null)}
                className='p-2 rounded-full'
                style={{ backgroundColor: colors.muted }}
              >
                <Feather name='x' size={16} color={colors.foreground} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDirectionsPress(selectedLocation)}
                className='p-2 rounded-full'
                style={{ backgroundColor: colors.primary }}
              >
                <Feather name='navigation' size={16} color='white' />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
