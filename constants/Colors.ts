/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#F07A7A';
const tintColorDark = '#F28C8C'; // Lighter coral for better contrast in dark mode

export const Colors = {
  light: {
    text: '#343A40', // Updated to match specification
    textSecondary: '#6C757D', // Updated to match specification
    background: '#F5F5F5',
    tint: tintColorLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorLight,
    primary: '#F07A7A',
    secondary: '#FFE5E5',
    card: '#FFFFFF',
    border: '#E9ECEF', // Updated to match specification
    buttonText: '#FFFFFF',
    buttonDisabled: '#cccccc',
    statusActive: '#10B981',
    statusNew: '#3B82F6',
    statusFading: '#F59E0B',
    statusEnded: '#6B7280',
    statusGhosted: '#EF4444',
    tagBackground: '#FEECEC', // Updated to match specification
    tagText: '#F07A7A',
    pollBackground: '#F8F9FA', // Updated to match specification
    pollBar: '#F07A7A',
    pollBarBackground: '#E5E5E5',
    commentBackground: '#F8F9FA',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  dark: {
    text: '#E9ECEF', // Light gray text (from specification)
    textSecondary: '#ADB5BD', // Muted text (from specification)
    background: '#1A1D21', // Very dark blue-gray (from specification)
    tint: tintColorDark,
    primary: '#F28C8C', // Lighter coral accent (from specification)
    secondary: '#495057', // Medium gray (from specification)
    card: '#2C2F33', // Dark gray cards (from specification)
    border: '#495057', // Subtle borders (from specification)
    buttonText: '#ffffff',
    buttonDisabled: '#495057', // Using secondary color for disabled
    icon: '#ADB5BD', // Using muted text color for icons
    tabIconDefault: '#ADB5BD', // Using muted text color
    tabIconSelected: tintColorDark,
    statusActive: '#34D399', // green-300 for better contrast
    statusNew: '#60A5FA', // blue-300 for better contrast
    statusFading: '#FBBF24', // yellow-300 for better contrast
    statusEnded: '#6B7280',
    statusGhosted: '#EF4444',
    tagBackground: '#593535', // Dark red (from specification)
    tagText: '#F28C8C', // Light coral (from specification)
    pollBackground: '#2A2D31', // From specification
    pollBar: '#F28C8C', // Using lighter coral for consistency
    pollBarBackground: '#495057', // Using secondary color
    commentBackground: '#2A2D31', // From specification
    success: '#34D399', // green-300 for better contrast
    warning: '#FBBF24', // yellow-300 for better contrast
    error: '#F87171', // red-400 for better contrast
  },
};
