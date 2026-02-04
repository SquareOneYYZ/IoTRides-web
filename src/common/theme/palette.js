import { grey } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode) => ({
  mode: darkMode ? 'dark' : 'light',

  // Background colors
  background: {
    default: darkMode ? '#121212' : grey[50], // Very dark for main content
    paper: darkMode ? '#1a1a1a' : '#ffffff', // Dark grey for sidebar/cards
  },

  // Primary color
  primary: {
    main: validatedColor(server?.attributes?.colorPrimary) || '#678FCA',
    light: '#8ba9d4',
    dark: '#4a6fa3',
    contrastText: '#ffffff',
  },

  // Secondary color
  secondary: {
    main: validatedColor(server?.attributes?.colorSecondary) || '#99D5C9',
    light: '#b3e0d7',
    dark: '#6fb3a8',
    contrastText: '#000000',
  },

  // Neutral greys
  neutral: {
    main: grey[500],
    light: grey[400],
    dark: grey[600],
  },

  // Map geometry color
  geometry: {
    main: darkMode ? '#5ec4e0' : '#3bb2d0',
    light: darkMode ? '#7dd1e8' : '#5fc2db',
    dark: darkMode ? '#3da8c4' : '#2a96b8',
  },

  // Text colors - optimized for dark mode
  text: {
    primary: darkMode ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.87)',
    secondary: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
    disabled: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.38)',
  },

  // Divider color
  divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',

  // Action colors
  action: {
    active: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
    hover: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    selected: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
    disabled: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
    disabledBackground: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
  },

  // Status colors
  success: {
    main: darkMode ? '#66bb6a' : '#4caf50',
    light: darkMode ? '#81c784' : '#6fbf73',
    dark: darkMode ? '#388e3c' : '#357a38',
  },
  warning: {
    main: darkMode ? '#ffa726' : '#ff9800',
    light: darkMode ? '#ffb74d' : '#ffac33',
    dark: darkMode ? '#f57c00' : '#c77700',
  },
  error: {
    main: darkMode ? '#f44336' : '#d32f2f',
    light: darkMode ? '#e57373' : '#e35d5b',
    dark: darkMode ? '#c62828' : '#aa2424',
  },
  info: {
    main: darkMode ? '#29b6f6' : '#0288d1',
    light: darkMode ? '#4fc3f7' : '#349fda',
    dark: darkMode ? '#0277bd' : '#01579b',
  },
});
