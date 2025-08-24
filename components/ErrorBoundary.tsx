import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Button, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { logger } from '@/utils/logger';
import * as Updates from 'expo-updates';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    logger.error('[ErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary] Error details:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  private handleReset = async () => {
    this.setState({ hasError: false, error: null });
    
    // In production, reload the app
    if (!__DEV__ && Updates.isEmbeddedLaunch) {
      await Updates.reloadAsync();
    }
  };

  public render() {
    if (this.state.hasError) {
      const colors = Colors.light; // Use light theme for error screen
      
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.content}>
            <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
            <Text style={[styles.title, { color: colors.text }]}>Oops! Something went wrong</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              We're sorry for the inconvenience. Please try again.
            </Text>
            {__DEV__ && this.state.error && (
              <View style={[styles.errorBox, { backgroundColor: colors.card }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
            <View style={styles.buttonContainer}>
              <Button
                title="Try Again"
                onPress={this.handleReset}
                color={colors.primary}
              />
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    maxWidth: '100%',
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    marginTop: 16,
  },
});