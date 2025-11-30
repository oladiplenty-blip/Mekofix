import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Button } from '../../components/common';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/types';

type WelcomeScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>
          <Text style={styles.appName}>Mekofix</Text>
          <Text style={styles.tagline}>Your trusted mechanic on demand</Text>
        </View>

        {/* Buttons Section */}
        <View style={styles.buttonContainer}>
          <Button
            title="Login"
            onPress={() => navigation.navigate('Login')}
            variant="primary"
            style={styles.button}
          />
          <Button
            title="Sign Up"
            onPress={() => navigation.navigate('CustomerSignup')}
            variant="outline"
            style={styles.button}
          />
        </View>

        {/* Sign Up Options */}
        <View style={styles.signupOptions}>
          <Text style={styles.signupText}>Sign up as:</Text>
          <View style={styles.signupLinks}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CustomerSignup')}
            >
              <Text style={styles.signupLink}>Customer</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('MechanicSignup')}
            >
              <Text style={styles.signupLink}>Mechanic</Text>
            </TouchableOpacity>
            <Text style={styles.separator}>•</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('VendorSignup')}
            >
              <Text style={styles.signupLink}>Vendor</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
    marginBottom: 32,
  },
  button: {
    width: '100%',
  },
  signupOptions: {
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  signupLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  signupLink: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  separator: {
    fontSize: 16,
    color: '#8E8E93',
  },
});

