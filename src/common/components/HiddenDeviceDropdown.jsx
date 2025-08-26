import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  Fade,
  IconButton,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import CloseIcon from '@mui/icons-material/Close';
import { devicesActions } from '../../store';
import { map } from '../../map/core/MapView';

const HiddenDeviceDropdown = () => {
  const dispatch = useDispatch();
  const hiddenDevices = useSelector((state) => state.devices.hiddenDevices);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [search, setSearch] = useState('');
  const [loadingDone, setLoadingDone] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const updateZoom = () => {
      try {
        setZoomLevel(map.getZoom());
      } catch (e) {
        console.warn('Error getting zoom level:', e);
      }
    };

    if (map && map.isStyleLoaded()) {
      updateZoom();
    } else if (map) {
      map.once('styledata', updateZoom);
    }

    map?.on('zoom', updateZoom);
    return () => map?.off('zoom', updateZoom);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoadingDone(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isHiddenDeviceLoading = !Array.isArray(hiddenDevices);
  const isEmpty = Array.isArray(hiddenDevices) && hiddenDevices.length === 0;

  if (zoomLevel < 15 || !loadingDone || !open) return null;

  if (isHiddenDeviceLoading) {
    return (
      <CenteredContainer>
        <Fade in timeout={400}>
          <Card elevation={4}>
            <CardContent
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 80,
                width: 260,
              }}
            >
              <CircularProgress />
            </CardContent>
          </Card>
        </Fade>
      </CenteredContainer>
    );
  }

  if (isEmpty) {
    console.info('Hidden devices list is empty at current zoom level.');
    return null;
  }

  const filteredDevices = Array.isArray(hiddenDevices)
    ? hiddenDevices.filter((device) => {
      const name = String(device.name || device.deviceId || '').toLowerCase();
      return name.includes(search.toLowerCase());
    })
    : [];

  const handleDeviceClick = (item) => {
    if (!item || typeof item !== 'object') {
      console.warn('Clicked device item is invalid:', item);
      return;
    }
    const id = item.id ?? item.deviceId;
    if (!id) {
      console.warn('No valid ID found for item:', item);
      return;
    }
    dispatch(devicesActions.selectId(item.deviceId));
  };

  return (
    <CenteredContainer>
      <Fade in timeout={500}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{
              position: 'absolute',
              top: -12,
              right: -12,
              backgroundColor: '#1f1f1f',
              color: '#fff',
              boxShadow: 3,
              zIndex: 10,
              '&:hover': {
                backgroundColor: '#333',
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Card
            elevation={4}
            sx={{
              width: 260,
              maxHeight: 320,
              overflowY: 'auto',
              backgroundColor: '#1f1f1f',
              color: '#fff',
              '&::-webkit-scrollbar': {
                width: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#555',
                borderRadius: '4px',
              },
            }}
          >
            <CardContent sx={{ pb: 3 }}>
              <div
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 5,
                  paddingTop: '10px',
                }}
              >
                <TextField
                  label="Search device"
                  variant="outlined"
                  size="small"
                  fullWidth
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {filteredDevices.length === 0 ? (
                <Typography
                  variant="body2"
                  align="center"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  No matching devices
                </Typography>
              ) : (
                <List dense>
                  {filteredDevices.slice(0, 300).map((device, index) => {
                    const key = device.deviceId || device.id || index;
                    const label =
                      device.name || device.deviceId || `Device ${index + 1}`;
                    return (
                      <React.Fragment key={key}>
                        <ListItem
                          alignItems="flex-start"
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleDeviceClick(device)}
                        >
                          <ListItemText
                            primary={(
                              <Typography
                                variant="subtitle2"
                                fontWeight={600}
                                color="primary"
                                sx={{ textDecoration: 'underline' }}
                              >
                                {label}
                              </Typography>
                            )}
                            secondary={(
                              <>
                                {device.fixTime && (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    display="block"
                                  >
                                    {Number.isNaN(
                                      new Date(device.fixTime).getTime()
                                    )
                                      ? 'Invalid time'
                                      : new Date(
                                        device.fixTime
                                      ).toLocaleString()}
                                  </Typography>
                                )}
                                {device.category && (
                                  <Typography variant="caption" display="block">
                                    Category:
                                    {' '}
                                    {device.category}
                                  </Typography>
                                )}
                                {device.clusterId && (
                                  <Typography variant="caption" display="block">
                                    Cluster ID:
                                    {' '}
                                    {device.clusterId}
                                  </Typography>
                                )}
                              </>
                            )}
                          />
                        </ListItem>
                        {index < filteredDevices.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}

              {filteredDevices.length > 300 && (
                <>
                  <Divider />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    align="center"
                    display="block"
                    sx={{ mt: 1 }}
                  >
                    Showing first 300 of
                    {' '}
                    {filteredDevices.length}
                    {' '}
                    devices
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </Fade>
    </CenteredContainer>
  );
};

const CenteredContainer = ({ children }) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      zIndex: 1000,
    }}
  >
    {children}
  </div>
);

export default HiddenDeviceDropdown;
