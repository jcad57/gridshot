export function getThemeClasses(theme: 'blue' | 'red') {
  return {
    primary: theme === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600',
    primaryText: theme === 'red' ? 'text-red-500' : 'text-blue-500',
    primaryBorder: theme === 'red' ? 'border-red-500' : 'border-blue-500',
    primaryBg: theme === 'red' ? 'bg-red-50 dark:bg-red-950/20' : 'bg-blue-50 dark:bg-blue-950/20',
    gradient: theme === 'red' 
      ? 'from-red-500 to-red-600' 
      : 'from-blue-500 to-purple-600',
    gradientText: theme === 'red'
      ? 'from-red-600 to-red-700'
      : 'from-blue-600 to-purple-600',
    accent: theme === 'red' ? 'text-red-500' : 'text-purple-500',
    ring: theme === 'red' ? 'ring-red-300 dark:ring-red-800' : 'ring-blue-300 dark:ring-blue-800',
  };
}
