import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, CustomerStackParamList, CustomerTabsParamList } from '../../navigation/types';

type RootNavigationProp = StackNavigationProp<RootStackParamList>;
type CustomerNavigationProp = StackNavigationProp<CustomerStackParamList>;
type CustomerTabsNavigationProp = BottomTabNavigationProp<CustomerTabsParamList>;

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({ visible, onClose }) => {
  const { logout, user } = useAuthStore();
  const navigation = useNavigation<any>();

  const handleLogout = () => {
    logout();
    onClose();
    // Navigation will automatically redirect to auth screen
  };

  const handleNavigateToHistory = () => {
    onClose();
    if (user?.user_type === 'customer') {
      // Navigate to HistoryTab - use getParent to access the tab navigator
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('CustomerTabs', {
          screen: 'HistoryTab',
        });
      } else {
        // Fallback: navigate from root
        navigation.navigate('Customer', {
          screen: 'CustomerTabs',
          params: {
            screen: 'HistoryTab',
          },
        });
      }
    }
  };

  const handleNavigateToPayments = () => {
    onClose();
    if (user?.user_type === 'customer') {
      // Navigate to Payments screen
      const parent = navigation.getParent();
      if (parent) {
        parent.navigate('Payments');
      } else {
        navigation.navigate('Customer', {
          screen: 'Payments',
        });
      }
    } else if (user?.user_type === 'mechanic') {
      // Navigate to WalletTab for mechanics
      navigation.navigate('Mechanic', {
        screen: 'MechanicTabs',
        params: {
          screen: 'WalletTab',
        },
      });
    }
  };

  const menuItems = [
    {
      id: 'history',
      icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Work History',
      onPress: handleNavigateToHistory,
    },
    {
      id: 'payments',
      icon: 'card-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Payments',
      onPress: handleNavigateToPayments,
    },
    {
      id: 'support',
      icon: 'help-circle-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Support/Help',
      onPress: () => {
        onClose();
        // Navigate to support
      },
    },
    {
      id: 'about',
      icon: 'information-circle-outline' as keyof typeof Ionicons.glyphMap,
      label: 'About',
      onPress: () => {
        onClose();
        // Navigate to about
      },
    },
    {
      id: 'logout',
      icon: 'log-out-outline' as keyof typeof Ionicons.glyphMap,
      label: 'Logout',
      onPress: handleLogout,
      isDestructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.drawer}>
              <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Menu</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#000000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.menuItems}>
                  {menuItems.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.menuItem}
                      onPress={item.onPress}
                    >
                      <Ionicons
                        name={item.icon}
                        size={24}
                        color={item.isDestructive ? '#FF3B30' : '#000000'}
                        style={styles.menuIcon}
                      />
                      <Text
                        style={[
                          styles.menuLabel,
                          item.isDestructive && styles.destructiveLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color="#8E8E93"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flexDirection: 'row',
  },
  drawer: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  menuItems: {
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F2F2F7',
  },
  menuIcon: {
    marginRight: 16,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  destructiveLabel: {
    color: '#FF3B30',
  },
});

