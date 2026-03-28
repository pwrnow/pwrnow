import { Modal, View, Text, TouchableOpacity, ScrollView, Pressable } from 'react-native';
import { useThemeColors } from '../hooks/useThemeColors';
import ModalOverlay from './ModalOverlay';
import CachedImage from './CachedImage';
import { t } from '../lib/i18n';
import { Organization } from '../types';

interface OrganizationListModalProps {
  visible: boolean;
  onClose: () => void;
  organizations: Organization[];
}

export default function OrganizationListModal({
  visible,
  onClose,
  organizations,
}: OrganizationListModalProps) {
  const { colors } = useThemeColors();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType='fade'
      onRequestClose={onClose}
    >
      <ModalOverlay
        onPress={onClose}
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
        }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            borderRadius: 14,
            padding: 20,
            backgroundColor: colors.background,
            maxHeight: 520,
          }}
        >
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: '600',
            }}
          >
            {t('organizedBy')}
          </Text>

          <ScrollView
            style={{ marginTop: 16 }}
            contentContainerStyle={{ paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {organizations.map((org, index) => (
              <View
                key={org.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: index < organizations.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    overflow: 'hidden',
                    backgroundColor: colors.muted,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {org.image_url ? (
                    <CachedImage
                      source={{ uri: org.image_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit='cover'
                    />
                  ) : (
                    <Text
                      style={{
                        color: colors.foreground,
                        fontWeight: '600',
                        fontSize: 14,
                      }}
                    >
                      {getInitials(org.name)}
                    </Text>
                  )}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 15,
                      fontWeight: '500',
                    }}
                  >
                    {org.name}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={{
              marginTop: 16,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: colors.muted,
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: colors.foreground,
                fontWeight: '600',
                textAlign: 'center',
                fontSize: 14,
              }}
            >
              {t('close')}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </ModalOverlay>
    </Modal>
  );
}

