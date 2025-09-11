import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

interface OfflineScreenProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const OfflineScreen: React.FC<OfflineScreenProps> = ({
  onRefresh,
  isRefreshing = false,
}) => {
  const { colors } = useTheme();

  const handleRefresh = () => {
    Haptics.selectionAsync();
    onRefresh();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: colors.muted },
          ]}
        >
          <Feather name="wifi-off" size={48} color={colors.foreground} />
        </View>

        <Text
          style={[
            styles.title,
            { color: colors.foreground },
          ]}
        >
          No Internet Connection
        </Text>

        <Text
          style={[
            styles.description,
            { color: colors.mutedForeground },
          ]}
        >
          You're not connected to the internet. Pull down to refresh when you have a connection.
        </Text>

        <TouchableOpacity
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={[
            styles.refreshButton,
            {
              backgroundColor: colors.primary,
              opacity: isRefreshing ? 0.6 : 1,
            },
          ]}
        >
          <Feather
            name={isRefreshing ? "loader" : "refresh-cw"}
            size={20}
            color="white"
            style={[
              styles.refreshIcon,
              isRefreshing && styles.spinning,
            ]}
          />
          <Text style={styles.refreshText}>
            {isRefreshing ? 'Checking...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
    justifyContent: 'center',
  },
  refreshIcon: {
    marginRight: 8,
  },
  refreshText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spinning: {
    // Animation will be handled by the parent component
  },
});

export default OfflineScreen;
