import React, { useState } from 'react';
import {
  AppBar,
  Breadcrumbs,
  Divider,
  Drawer,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './LocalizationProvider';

const useStyles = makeStyles((theme) => ({
  desktopRoot: {
    height: '100%',
    display: 'flex',
  },
  mobileRoot: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  desktopDrawer: {
    width: (props) => (props.miniVariant ? '73px' : '250px'),
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      backgroundColor: '#212121',
      color: '#fff',
      width: (props) => (props.miniVariant ? '73px' : '250px'),
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowY: 'auto',
      overflowX: 'hidden',
      /* Custom Scrollbar - Webkit (Chrome, Safari, Edge) */
      '&::-webkit-scrollbar': {
        width: '1px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'transparent',
        borderRadius: '10px',
        transition: 'background-color 0.3s',
      },
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#555',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#777',
      },
      /* Firefox */
      scrollbarWidth: 'thin',
      scrollbarColor: '#555 transparent',
    },
  },
  mobileDrawer: {
    width: '250px',
    '& .MuiDrawer-paper': {
      backgroundColor: '#212121',
      color: '#fff',
      width: '250px',
      overflowY: 'auto',
      /* Custom Scrollbar - Webkit (Chrome, Safari, Edge) */
      '&::-webkit-scrollbar': {
        width: '1px',
      },
      '&::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'transparent',
        borderRadius: '10px',
        transition: 'background-color 0.3s',
      },
      '&:hover::-webkit-scrollbar-thumb': {
        backgroundColor: '#555',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: '#777',
      },
      /* Firefox */
      scrollbarWidth: 'thin',
      scrollbarColor: '#555 transparent',
    },
  },
  mobileToolbar: {
    zIndex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  toolbar: {
    backgroundColor: '#212121',
    color: '#fff',
    minHeight: '64px',
    padding: (props) => (props.miniVariant ? '16px 8px' : '16px'),
    justifyContent: (props) => (props.miniVariant ? 'center' : 'flex-start'),
  },
  divider: {
    borderColor: '#1f2937',
  },
  iconButton: {
    color: '#fff',
    '&:hover': {
      backgroundColor: '#313131ff',
    },
  },
  pageTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#fff',
  },
}));

const PageTitle = ({ breadcrumbs }) => {
  const theme = useTheme();
  const t = useTranslation();
  const classes = useStyles();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  if (desktop) {
    return (
      <Typography variant="h6" noWrap className={classes.pageTitle}>
        {t(breadcrumbs[0])}
      </Typography>
    );
  }
  return (
    <Breadcrumbs>
      {breadcrumbs.slice(0, -1).map((breadcrumb) => (
        <Typography variant="h6" color="inherit" key={breadcrumb}>
          {t(breadcrumb)}
        </Typography>
      ))}
      <Typography variant="h6" color="textPrimary">
        {t(breadcrumbs[breadcrumbs.length - 1])}
      </Typography>
    </Breadcrumbs>
  );
};

const PageLayout = ({ menu, breadcrumbs, children }) => {
  const [miniVariant, setMiniVariant] = useState(false);
  const classes = useStyles({ miniVariant });
  const theme = useTheme();
  const navigate = useNavigate();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const [openDrawer, setOpenDrawer] = useState(false);

  const toggleDrawer = () => setMiniVariant(!miniVariant);

  return desktop ? (
    <div className={classes.desktopRoot}>
      <Drawer
        variant="permanent"
        className={classes.desktopDrawer}
        classes={{ paper: classes.desktopDrawer }}
      >
        <Toolbar className={classes.toolbar}>
          {!miniVariant && (
            <>
              <IconButton
                className={classes.iconButton}
                edge="start"
                sx={{ mr: 2 }}
                onClick={() => navigate('/')}
              >
                <ArrowBackIcon />
              </IconButton>
              <PageTitle breadcrumbs={breadcrumbs} />
            </>
          )}
          <IconButton
            className={classes.iconButton}
            edge="start"
            sx={{ ml: miniVariant ? 0 : 'auto' }}
            onClick={toggleDrawer}
          >
            {miniVariant ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Toolbar>
        <Divider className={classes.divider} />
        {React.cloneElement(menu, { miniVariant })}
      </Drawer>
      <div className={classes.content}>{children}</div>
    </div>
  ) : (
    <div className={classes.mobileRoot}>
      <Drawer
        variant="temporary"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        className={classes.mobileDrawer}
        classes={{ paper: classes.mobileDrawer }}
      >
        {menu}
      </Drawer>
      <AppBar className={classes.mobileToolbar} position="static" color="inherit">
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2 }} onClick={() => setOpenDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <PageTitle breadcrumbs={breadcrumbs} />
        </Toolbar>
      </AppBar>
      <div className={classes.content}>{children}</div>
    </div>
  );
};

export default PageLayout;
