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

  MuiListItemButton: {
    styleOverrides: {
      root: ({ theme }) => ({
        borderRadius: 10,
        marginBottom: theme.spacing(0.5),

        '&:hover': {
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(0, 0, 0, 0.04)',
        },

        '&.Mui-selected': {
          backgroundColor: theme.palette.mode === 'dark'
            ? '#ffffff'
            : 'rgba(0, 132, 255, 0.08)',
          color: theme.palette.mode === 'dark' ? '#000000 !important' : '#3385F0',

          '& .MuiListItemIcon-root': {
            color: theme.palette.mode === 'dark' ? '#000000 !important' : '#3385F0',
          },

          '& .MuiListItemText-primary': {
            color: theme.palette.mode === 'dark' ? '#000000 !important' : '#3385F0',
            fontWeight: 500,
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
        minWidth: 20,
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
