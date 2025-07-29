import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Pressable,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthButton } from '@/components/ui/auth/AuthButton';
import { Colors } from '@/constants/Colors';
import { PhoneInput, validatePhoneForCountry } from '@/components/ui/auth/PhoneInput';
import { AuthService } from '@/services/supabase/auth';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Use country-specific validation
    if (!validatePhoneForCountry(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid phone number for the selected country');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Sending SMS to:', phoneNumber);
      
      // Send SMS verification code using Supabase
      await AuthService.sendPhoneOtp(phoneNumber);
      
      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verify-otp',
        params: { phoneNumber: phoneNumber }
      });
    } catch (error: any) {
      console.error('SMS sending error:', error);
      
      // Handle specific error messages
      let errorMessage = 'Failed to send verification code. Please try again.';
      let showAlternativeAuth = false;
      
      if (error?.message) {
        if (error.message.includes('Invalid phone number')) {
          errorMessage = 'Please enter a valid phone number.';
        } else if (error.message.includes('Phone provider not configured')) {
          errorMessage = 'SMS service is temporarily unavailable. Please try again later.';
          showAlternativeAuth = true;
        } else if (error.message.includes('rate limit')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('Network connection issue')) {
          errorMessage = error.message;
          showAlternativeAuth = true;
        } else if (error.message.includes('Phone authentication is not configured')) {
          errorMessage = error.message;
          showAlternativeAuth = true;
        } else if (error.message.includes('Signup requires a valid password')) {
          // This error suggests SMS auth might not be properly configured
          errorMessage = 'SMS authentication is not properly configured. Please contact support.';
          showAlternativeAuth = true;
        }
      }
      
      // Show alert with option to use alternative auth
      if (showAlternativeAuth) {
        Alert.alert(
          'Authentication Issue',
          errorMessage + '\n\nWould you like to use email authentication instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use Email', 
              onPress: () => router.push('/(auth)/signin')
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };
  
  const handleDebug = async () => {
    Alert.alert(
      'Network Diagnostics',
      'Choose a diagnostic test:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Quick Network Test', 
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Test internet connection
              const hasInternet = await checkInternetConnection();
              console.log('Internet connection:', hasInternet);
              
              // Test Supabase connectivity
              const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
              const supabaseTest = await testNetworkConnectivity(supabaseUrl);
              console.log('Supabase connectivity:', supabaseTest);
              
              let message = '';
              if (!hasInternet) {
                message = 'No internet connection detected. Please check your network settings.';
              } else if (!supabaseTest.success) {
                message = `Cannot connect to Supabase.\nError: ${supabaseTest.error}\n\nTry:\n1. Restart the app\n2. Check if VPN is blocking connections\n3. Verify Supabase URL is correct`;
              } else {
                message = `Network is working!\nInternet: ✅\nSupabase: ✅ (${supabaseTest.latency}ms)\n\nPhone auth might not be configured in Supabase.`;
              }
              
              Alert.alert('Network Test Results', message);
            } catch (error: any) {
              Alert.alert('Test Error', error.message);
            } finally {
              setIsLoading(false);
            }
          }
        },
        { 
          text: 'Full Debug', 
          onPress: async () => {
            try {
              await debugSupabaseConnection();
              Alert.alert('Debug Complete', 'Check console logs for details');
            } catch (error: any) {
              Alert.alert('Debug Error', error.message);
            }
          }
        },
        {
          text: 'Test Supabase',
          onPress: async () => {
            try {
              console.log('🧪 Running Supabase tests...');
              await testSupabaseConnection();
              console.log('\n🌐 Running raw network tests...');
              await testRawNetwork();
              Alert.alert('Test Complete', 'Check console logs for detailed results');
            } catch (error: any) {
              Alert.alert('Test Error', error.message);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent={true} backgroundColor="transparent" />
      <LinearGradient 
        colors={[Colors.light.primary, Colors.light.secondary]} 
        style={styles.container}
        start={{ x: 0.1, y: 0.2 }}
        end={{ x: 0.9, y: 1.0 }}
      >
        <SafeAreaView style={styles.safeArea} edges={[]}>
          <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.content}>
            {/* Header with back button */}
            <View style={styles.header}>
              <Pressable
                onPress={handleGoBack}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.pressed
                ]}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </Pressable>
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.title}>My number is</Text>
              <Text style={styles.subtitle}>
                We'll send you a login code. Standard rates may apply.
              </Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputContainer}>
              <PhoneInput
                label=""
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                onboardingStyle={true}
              />
              
              <AuthButton
                title={isLoading ? "Sending..." : "Continue"}
                onPress={handleSendCode}
                isLoading={isLoading}
                variant="primary"
                style={styles.continueButton}
                textStyle={styles.continueButtonText}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to receive SMS messages from RostrDating. 
                Message and data rates may apply.
              </Text>
              
              {/* Debug button - remove in production */}
              <Pressable
                onPress={handleDebug}
                style={styles.debugButton}
              >
                <Text style={styles.debugButtonText}>Network Diagnostics</Text>
              </Pressable>
            </View>
          </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 80, // Increased for full screen
    paddingBottom: 60, // Increased for full screen
  },
  header: {
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  continueButton: {
    backgroundColor: 'white',
    borderRadius: 24,
    minHeight: 52,
  },
  continueButtonText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
  debugButton: {
    marginTop: 12,
    padding: 8,
  },
  debugButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});