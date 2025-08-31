// Production ESLint config - more lenient for build purposes
module.exports = {
  extends: ['expo', '@expo/eslint-config'],
  rules: {
    // Warnings only for unused vars (won't break build)
    '@typescript-eslint/no-unused-vars': 'warn',
    // Allow unescaped entities in JSX (common in React apps)
    'react/no-unescaped-entities': 'warn', 
    // Allow missing dependencies in useEffect (often intentional)
    'react-hooks/exhaustive-deps': 'warn',
    // Don't break build for console statements (we've already addressed this)
    'no-console': 'warn',
  },
};