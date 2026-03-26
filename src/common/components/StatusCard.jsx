import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Draggable from 'react-draggable';
import {
  Card,
  CardContent,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  CardMedia,
  TableFooter,
  Link,
  Tooltip,
  Box,
  Skeleton,
  Divider,
  Typography,
  Badge,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';
import LinkIcon from '@mui/icons-material/Link';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useAdministrator, useDeviceReadonly } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import { formatTime } from '../util/formatter';

const DRAWER_WIDTH = 240;

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    position: 'relative',
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.primary.contrastText,
    mixBlendMode: 'difference',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(1, 1, 0, 2),
    cursor: 'move',
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTableCell-sizeSmall:first-child': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
  },
  root: ({ desktopPadding }) => ({
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  }),

  cardRow: {
    display: 'flex',
    alignItems: 'stretch',
    pointerEvents: 'auto',
  },

  chevronTab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 20,
    cursor: 'pointer',
    backgroundColor: theme.palette.background.paper,
    borderLeft: `1px solid ${theme.palette.divider}`,
    borderRadius: `0 ${theme.shape.borderRadius}px ${theme.shape.borderRadius}px 0`,
    boxShadow: theme.shadows[3],
  },

  eventsPanel: {
    width: DRAWER_WIDTH,
    overflow: 'hidden',
    transition: theme.transitions.create('max-width', {
      easing: theme.transitions.easing.easeInOut,
      duration: theme.transitions.duration.standard,
    }),
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[3],
    borderRadius: theme.shape.borderRadius,
    marginLeft: theme.spacing(0.5),
    display: 'flex',
    flexDirection: 'column',
  },
  eventsPanelOpen: {
    maxWidth: DRAWER_WIDTH,
  },
  eventsPanelClosed: {
    maxWidth: 0,
  },

  eventsPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1, 1.5, 0.5),
  },
  eventsPanelTitle: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
  },
  eventsPanelIcon: {
    fontSize: '0.85rem',
    color: theme.palette.text.secondary,
  },
  eventsPanelContent: {
    padding: theme.spacing(0.5, 1.5, 1.5),
    flex: 1,
    overflowY: 'auto',
    minWidth: DRAWER_WIDTH - theme.spacing(3),
  },
  eventsSection: {},
  eventRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0.4, 0),
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  eventType: {
    fontSize: '0.78rem',
    color: theme.palette.text.primary,
    flex: 1,
    textTransform: 'capitalize',
  },
  eventTime: {
    fontSize: '0.72rem',
    color: theme.palette.text.secondary,
    whiteSpace: 'nowrap',
    marginLeft: theme.spacing(1),
  },
  noEventsText: {
    fontSize: '0.75rem',
    color: theme.palette.text.disabled,
    fontStyle: 'italic',
    padding: theme.spacing(0.5, 0),
  },
  skeletonRow: {
    marginBottom: theme.spacing(0.5),
  },
}));

const formatEventType = (type = '') => type
  .replace(/([A-Z])/g, ' $1')
  .replace(/^./, (c) => c.toUpperCase())
  .trim();

const StatusRow = ({ name, content }) => {
  const classes = useStyles();
  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2">{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" color="textSecondary">{content}</Typography>
      </TableCell>
    </TableRow>
  );
};

export const RecentEventsSection = ({ deviceId, onCountChange }) => {
  const classes = useStyles();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const to = new Date();
        const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
        const ALL_EVENT_TYPES = [
          'deviceOnline', 'deviceUnknown', 'deviceOffline',
          'deviceInactive', 'deviceMoving', 'deviceStopped',
          'deviceOverspeed', 'deviceFuelDrop', 'deviceFuelIncrease',
          'commandResult', 'geofenceEnter', 'geofenceExit',
          'alarm', 'ignitionOn', 'ignitionOff',
          'maintenance', 'textMessage', 'driverChanged',
        ];

        const params = new URLSearchParams({
          deviceId,
          from: from.toISOString(),
          to: to.toISOString(),
        });
        ALL_EVENT_TYPES.forEach((type) => params.append('type', type));

        const response = await fetch(`/api/reports/events?${params.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        if (!cancelled) {
          const sorted = [...data].sort(
            (a, b) => new Date(b.eventTime) - new Date(a.eventTime),
          );
          const top3 = sorted.slice(0, 3);
          setEvents(top3);
          if (onCountChange) onCountChange(top3.length);
        }
      } catch (_) {
        if (!cancelled) {
          setEvents([]);
          if (onCountChange) onCountChange(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (deviceId) fetchEvents();

    return () => { cancelled = true; };
  }, [deviceId]);

  if (loading) {
    return (
      <Box className={classes.eventsSection}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="text" height={24} className={classes.skeletonRow} />
        ))}
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box className={classes.eventsSection}>
        <Typography className={classes.noEventsText}>
          No alerts in the last 24 hours
        </Typography>
      </Box>
    );
  }

  return (
    <Box className={classes.eventsSection}>
      {events.map((event) => (
        <Box key={event.id} className={classes.eventRow}>
          <Typography className={classes.eventType}>
            {formatEventType(event.type)}
          </Typography>
          <Typography className={classes.eventTime}>
            {formatTime(event.eventTime, 'minutes')}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const StatusCard = ({
  deviceId, position, onClose, disableActions, desktopPadding = 0,
}) => {
  const classes = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [eventCount, setEventCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(null);

  const t = useTranslation();
  const admin = useAdministrator();
  const deviceReadonly = useDeviceReadonly();
  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);
  const deviceImage = device?.attributes?.deviceImage;
  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference('positionItems', 'fixTime,address,speed,totalDistance');
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');
  const [anchorEl, setAnchorEl] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    setDrawerOpen(null);
    if (device) {
      const dismissed = Object.prototype.hasOwnProperty.call(
        device.attributes ?? {},
        'PanelAlert',
      );
      setDrawerOpen(!dismissed);
    }
  }, [deviceId]);

  const handleCloseDrawer = async () => {
    setDrawerOpen(false);
    try {
      await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...device,
          attributes: {
            ...device.attributes,
            PanelAlert: true,
          },
        }),
      });
      const refreshed = await fetch('/api/devices');
      if (refreshed.ok) {
        dispatch(devicesActions.refresh(await refreshed.json()));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to persist PanelAlert:', e);
    }
  };

  const handleOpenDrawer = async () => {
    setDrawerOpen(true);
    try {
      const updatedAttributes = { ...device.attributes };
      delete updatedAttributes.PanelAlert;
      await fetch(`/api/devices/${deviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...device,
          attributes: updatedAttributes,
        }),
      });
      const refreshed = await fetch('/api/devices');
      if (refreshed.ok) {
        dispatch(devicesActions.refresh(await refreshed.json()));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to remove PanelAlert:', e);
    }
  };

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetch('/api/devices');
      if (response.ok) {
        dispatch(devicesActions.refresh(await response.json()));
      } else {
        throw Error(await response.text());
      }
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetch('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    if (response.ok) {
      const item = await response.json();
      const permissionResponse = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
      });
      if (!permissionResponse.ok) {
        throw Error(await permissionResponse.text());
      }
      navigate(`/settings/geofence/${item.id}`);
    } else {
      throw Error(await response.text());
    }
  }, [navigate, position]);

  if (drawerOpen === null) return null;

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Draggable handle={`.${classes.media}, .${classes.header}`}>
            <Box className={classes.cardRow}>
              <Card elevation={3} className={classes.card}>
                {deviceImage ? (
                  <CardMedia
                    className={classes.media}
                    image={`/api/media/${device.uniqueId}/${deviceImage}`}
                  >
                    <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                      <CloseIcon fontSize="small" className={classes.mediaButton} />
                    </IconButton>
                  </CardMedia>
                ) : (
                  <div className={classes.header}>
                    <Typography variant="body2" color="textSecondary">
                      {device.name}
                    </Typography>
                    <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </div>
                )}

                {position && (
                  <CardContent className={classes.content}>
                    <Table size="small" classes={{ root: classes.table }}>
                      <TableBody>
                        {positionItems
                          .split(',')
                          .filter(
                            (key) => position.hasOwnProperty(key)
                              || position.attributes.hasOwnProperty(key),
                          )
                          .map((key) => (
                            <StatusRow
                              key={key}
                              name={positionAttributes[key]?.name || key}
                              content={(
                                <PositionValue
                                  position={position}
                                  property={position.hasOwnProperty(key) ? key : null}
                                  attribute={position.hasOwnProperty(key) ? null : key}
                                />
                              )}
                            />
                          ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className={classes.cell}>
                            <Typography variant="body2">
                              <Link component={RouterLink} to={`/position/${position.id}`}>
                                {t('sharedShowDetails')}
                              </Link>
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                )}

                <CardActions classes={{ root: classes.actions }} disableSpacing>
                  <Tooltip title={t('sharedConnections')}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}/connections`)}
                      disabled={disableActions}
                    >
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sharedExtra')}>
                    <IconButton
                      color="secondary"
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                      disabled={!position}
                    >
                      <PendingIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('reportReplay')}>
                    <IconButton
                      onClick={() => navigate('/replay')}
                      disabled={disableActions || !position}
                    >
                      <ReplayIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('commandTitle')}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                      disabled={disableActions}
                    >
                      <PublishIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t('sharedEdit')}>
                    <IconButton
                      onClick={() => navigate(`/settings/device/${deviceId}`)}
                      disabled={disableActions || deviceReadonly}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  {admin && (
                    <Tooltip title={t('sharedRemove')}>
                      <IconButton
                        color="error"
                        onClick={() => setRemoving(true)}
                        disabled={disableActions || deviceReadonly}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </CardActions>
              </Card>

              <Tooltip title={drawerOpen ? 'Hide alerts' : 'Show alerts'}>
                <Box
                  className={classes.chevronTab}
                  onClick={drawerOpen ? handleCloseDrawer : handleOpenDrawer}
                >
                  <Badge
                    badgeContent={!drawerOpen ? eventCount : 0}
                    color="error"
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  >
                    {drawerOpen
                      ? <ChevronRightIcon fontSize="small" />
                      : <ChevronLeftIcon fontSize="small" />}
                  </Badge>
                </Box>
              </Tooltip>

              <Box
                className={`${classes.eventsPanel} ${drawerOpen ? classes.eventsPanelOpen : classes.eventsPanelClosed}`}
              >
                <Box className={classes.eventsPanelHeader}>
                  <NotificationsIcon className={classes.eventsPanelIcon} />
                  <Typography className={classes.eventsPanelTitle}>
                    Recent Alerts (24h)
                  </Typography>
                </Box>
                <Divider />
                <Box className={classes.eventsPanelContent}>
                  <RecentEventsSection
                    deviceId={deviceId}
                    onCountChange={setEventCount}
                  />
                </Box>
              </Box>

            </Box>
          </Draggable>
        )}
      </div>

      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}
          >
            {t('linkGoogleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}
          >
            {t('linkAppleMaps')}
          </MenuItem>
          <MenuItem
            component="a"
            target="_blank"
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}
          >
            {t('linkStreetView')}
          </MenuItem>
          {navigationAppTitle && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
            >
              {navigationAppTitle}
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}>
              <Typography color="secondary">{t('deviceShare')}</Typography>
            </MenuItem>
          )}
        </Menu>
      )}

      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
