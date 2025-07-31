import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Conditionally import Updates
let Updates: any;
try {
  Updates = require('expo-updates');
} catch {
  // expo-updates not available
  Updates = null;
}
import { Colors } from '@/constants/Colors';
import { isProduction, debugMode } from '@/config/env';
import { captureException } from '@/services/sentry';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (debugMode) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });

    // In production, you would send this to your error reporting service
    // TODO: Send to Sentry when configured
    if (isProduction) {
      this.logErrorToService(error, errorInfo);
    }
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // Send to Sentry
    captureException(error, {
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      errorCount: this.state.errorCount,
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    });
  };

  handleReload = async () => {
    try {
      // In development, just reset the error boundary
      if (!isProduction) {
        this.handleReset();
        return;
      }

      // In production, reload the app if Updates is available
      if (Updates && Updates.reloadAsync) {
        await Updates.reloadAsync();
      } else {
        // Fallback to resetting the error boundary
        this.handleReset();
      }
    } catch (error) {
      console.error('Failed to reload app:', error);
      this.handleReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <SafeAreaView style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.errorContainer}>
              <Ionicons 
                name="alert-circle-outline" 
                size={80} 
                color={Colors.light.error} 
              />
              
              <Text style={styles.title}>Oops! Something went wrong</Text>
              
              <Text style={styles.message}>
                We're sorry for the inconvenience. The app encountered an unexpected error.
              </Text>

              {/* Show error details in development */}
              {debugMode && this.state.error && (
                <View style={styles.errorDetails}>
                  <Text style={styles.errorDetailTitle}>Error Details (Dev Only):</Text>
                  <Text style={styles.errorMessage}>
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <ScrollView style={styles.stackTrace}>
                      <Text style={styles.stackTraceText}>
                        {this.state.errorInfo.componentStack}
                      </Text>
                    </ScrollView>
                  )}
                </View>
              )}

              <View style={styles.buttonContainer}>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton]}
                  onPress={this.handleReload}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>
                    {isProduction ? 'Reload App' : 'Try Again'}
                  </Text>
                </TouchableOpacity>

                {!isProduction && (
                  <TouchableOpacity 
                    style={[styles.button, styles.secondaryButton]}
                    onPress={this.handleReset}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.secondaryButtonText}>Dismiss</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Prevent infinite error loops */}
              {this.state.errorCount > 3 && (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning-outline" size={20} color="#FF9500" />
                  <Text style={styles.warningText}>
                    Multiple errors detected. Please restart the app if the problem persists.
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1E',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    maxWidth: 300,
  },
  buttonContainer: {
    gap: 12,
    width: '100%',
    maxWidth: 280,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
  },
  secondaryButtonText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '500',
  },
  errorDetails: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  errorDetailTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 12,
    color: '#856404',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  stackTrace: {
    maxHeight: 200,
    marginTop: 8,
  },
  stackTraceText: {
    fontSize: 10,
    color: '#856404',
    fontFamily: 'monospace',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    maxWidth: 300,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
  },
});

// HOC for easy component wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}