export default {
  MuiUseMediaQuery: {
    defaultProps: {
      noSsr: true,
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.default,
      }),
    },
  },
  MuiButton: {
    styleOverrides: {
      sizeMedium: {
        height: '40px',
      },
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiSnackbar: {
    defaultProps: {
      anchorOrigin: {
        vertical: 'bottom',
        horizontal: 'center',
      },
    },
  },
  MuiTooltip: {
    defaultProps: {
      enterDelay: 500,
      enterNextDelay: 500,
    },
  },

  // AUTO-HIDE OVERLAY SCROLLBAR - Appears only when scrolling/hovering
  MuiCssBaseline: {
    styleOverrides: (theme) => ({
      // Webkit browsers (Chrome, Safari, Edge, Opera)
      '*': {
        // Make scrollbar overlay (not take up space)
        scrollbarGutter: 'stable',
      },
      '*::-webkit-scrollbar': {
        width: '8px',
        height: '8px',
      },
      '*::-webkit-scrollbar-track': {
        backgroundColor: 'transparent',
      },
      '*::-webkit-scrollbar-thumb': {
        backgroundColor: 'transparent', // Hidden by default
        borderRadius: '10px',
        transition: 'background-color 0.3s ease',
      },
      // Show scrollbar on hover or when scrolling
      '*:hover::-webkit-scrollbar-thumb': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.3)'
          : 'rgba(0, 0, 0, 0.3)',
      },
      '*::-webkit-scrollbar-thumb:hover': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.5)'
          : 'rgba(0, 0, 0, 0.5)',
      },
      '*::-webkit-scrollbar-thumb:active': {
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.6)'
          : 'rgba(0, 0, 0, 0.6)',
      },

      // Additional styling for specific scrollable containers
      '.scrollable-container': {
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'transparent',
        },
        '&:hover::-webkit-scrollbar-thumb, &.scrolling::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.3)'
            : 'rgba(0, 0, 0, 0.3)',
        },
      },
    }),
  },

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 8,
        marginBottom: theme.spacing(0.5),
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),

        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
        },

        '&.Mui-selected': {
          backgroundColor: theme.palette.mode === 'dark'
            ? '#ffffff'
            : 'rgba(0, 0, 0, 0.08)',
          fontWeight: 500,
          color: theme.palette.mode === 'dark' ? '#000000 !important' : theme.palette.text.primary,

          '& .MuiListItemIcon-root': {
            color: theme.palette.mode === 'dark' ? '#000000 !important' : theme.palette.text.primary,
          },

          '& .MuiListItemText-primary': {
            color: theme.palette.mode === 'dark' ? '#000000 !important' : theme.palette.text.primary,
          },

          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? '#f5f5f5'
              : 'rgba(0, 0, 0, 0.12)',
          },
        },
      }),
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark'
          ? '#1a1a1a'
          : theme.palette.background.paper,
        borderRight: theme.palette.mode === 'dark'
          ? 'none'
          : `1px solid ${theme.palette.divider}`,
      }),
    },
  },

  MuiListItemIcon: {
    styleOverrides: {
      root: ({ theme }) => ({
        color: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.7)'
          : theme.palette.text.secondary,
        minWidth: 40,
      }),
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: ({ theme }) => ({
        color: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.95)'
          : theme.palette.text.primary,
        fontWeight: 400,
      }),
    },
  },

  MuiDivider: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : theme.palette.divider,
      }),
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.mode === 'dark'
          ? '#1a1a1a'
          : theme.palette.background.paper,
        color: theme.palette.mode === 'dark'
          ? '#ffffff'
          : theme.palette.text.primary,
      }),
    },
  },

  MuiAppBar: {
    styleOverrides: {
      root: ({ theme }) => ({
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
    },
  },
};
