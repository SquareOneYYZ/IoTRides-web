import React, { useState } from 'react';
import {
  Navigation,
  Place,
  Settings,
  Help,
  Search,
  BarChart,
  PieChart,
  MoreHoriz,
  Devices,
  Notifications,
  Close,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import PersonIcon from '@mui/icons-material/Person';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import RouteIcon from '@mui/icons-material/Route';
import FolderIcon from '@mui/icons-material/Folder';
import CreateIcon from '@mui/icons-material/Create';
import { useTheme } from '@mui/material/styles';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText, IconButton, Typography, Box, Collapse,
} from '@mui/material';

// Move AccordionSection outside the main component
const AccordionSection = ({ title, isOpen, onToggle, children, theme }) => (
  <Box>
    <ListItemButton
      onClick={onToggle}
      sx={{
        borderRadius: 2,
        mx: 1,
        mt: 1,
        mb: 0.5,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
        },
      }}
    >
      <ListItemText
        primary={title}
        primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
      />
      {isOpen ? <ExpandLess /> : <ExpandMore />}
    </ListItemButton>
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <Box sx={{ pl: 1 }}>
        {children}
      </Box>
    </Collapse>
  </Box>
);

export const DashboardSidebar = ({
  isOpen,
  onClose,
  activeNav,
  setActiveNav,
}) => {
  const theme = useTheme();
  const [reportsOpen, setReportsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const sidebarStructure = {
    main: [
      { key: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: BarChart },
      { key: 'mapView', label: 'Map View', href: '/', icon: Place },
    ],
    reports: [
      {
        key: 'eventsReport',
        label: 'Events Report',
        href: '/reports/event',
        icon: BarChart,
      },
      { key: 'geofence', label: 'Geofence Activity', href: '/reports/geofence-activity', icon: Place },
      { key: 'trips', label: 'Trips Report', href: '/reports/trip', icon: PieChart },
      { key: 'replay', label: 'Replay', href: '/replay', icon: RouteIcon },
      { key: 'stops', label: 'Stops', href: '/reports/stop', icon: PauseCircleFilledIcon },
      { key: 'reportsMore', label: 'More', href: '/reports/combined', icon: MoreHoriz },
    ],
    settings: [
      { key: 'devices', label: 'Devices', href: '/settings/devices', icon: Devices },
      {
        key: 'notifications',
        label: 'Notifications',
        href: '/settings/notifications',
        icon: Notifications,
      },
      {
        key: 'Groups',
        label: 'Groups',
        href: '/settings/groups',
        icon: FolderIcon,
      },
      {
        key: 'geofences',
        label: 'Geofences',
        href: '/settings/geofences',
        icon: CreateIcon,
      },
      { key: 'preferences', label: 'Preferences', href: '/settings/preferences', icon: Settings },
      { key: 'settingsMore', label: 'More', href: '/settings/preferences', icon: MoreHoriz },
    ],
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeNav === item.key;

    return (
      <ListItemButton
        key={item.key}
        component="a"
        href={item.href}
        selected={isActive}
        sx={{
          borderRadius: 2,
          mx: 1,
          mb: 0.5,
          '&.Mui-selected': {
            backgroundColor: theme.palette.mode === 'dark' ? '#ffffff' : 'rgba(0, 0, 0, 0.08)',
            color: theme.palette.mode === 'dark' ? '#000000' : theme.palette.text.primary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#f5f5f5' : 'rgba(0, 0, 0, 0.12)',
            },
            '& .MuiListItemIcon-root': {
              color: theme.palette.mode === 'dark' ? '#000000' : theme.palette.text.primary,
            },
          },
          '&:hover': {
            backgroundColor: theme.palette.action.hover,
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 40 }}>
          <Icon sx={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14 }} />
      </ListItemButton>
    );
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Navigation sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            IOT Rides
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            display: { xs: 'flex', md: 'none' },
            color: theme.palette.text.primary,
          }}
        >
          <Close />
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List>
          {sidebarStructure.main.map(renderNavItem)}
        </List>

        {/* Reports Accordion */}
        <AccordionSection
          title="Reports"
          isOpen={reportsOpen}
          onToggle={() => setReportsOpen(!reportsOpen)}
          theme={theme}
        >
          <List>
            {sidebarStructure.reports.map(renderNavItem)}
          </List>
        </AccordionSection>

        {/* Settings Accordion */}
        <AccordionSection
          title="Settings"
          isOpen={settingsOpen}
          onToggle={() => setSettingsOpen(!settingsOpen)}
          theme={theme}
        >
          <List>
            {sidebarStructure.settings.map(renderNavItem)}
          </List>
        </AccordionSection>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          p: 1.5,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <List>
          <ListItemButton
            component="a"
            href="/settings/preferences"
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Settings sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Settings" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>

          <ListItemButton
            component="a"
            href="#"
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Help sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Get Help" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>

          <ListItemButton
            component="a"
            href="#"
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Search sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Search" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>

          <ListItemButton
            component="a"
            href="#"
            sx={{
              borderRadius: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <PersonIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14 }} />
          </ListItemButton>
        </List>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={onClose}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: 250,
            backgroundColor: theme.palette.background.paper,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: 250,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default DashboardSidebar;
