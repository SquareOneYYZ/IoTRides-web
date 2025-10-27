import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
  CircularProgress, Typography, Box, Alert, Paper,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapRoutePath from '../map/MapRoutePath';
import { useCatch } from '../reactHelper';

const MediaDetailsPage = () => {
  const classes = useReportStyles();
  const navigate = useNavigate();
  const selectedEvent = useSelector((state) => state.events.selectedEvent);
  const [eventDetails, setEventDetails] = useState(null);
  const [route, setRoute] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const columns = [
    'startTime',
    'endTime',
    'distance',
    'averageSpeed',
    'maxSpeed',
    'duration',
  ];

  const fetchData = useCatch(async () => {
    if (!selectedEvent || !selectedEvent.id) {
      setError('No media event selected. Please go back and select a media event.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const eventResponse = await fetch(`/api/events/${selectedEvent.id}`, {
        headers: { Accept: 'application/json' },
      });
      if (!eventResponse.ok) {
        throw new Error(`Failed to fetch event details: ${await eventResponse.text()}`);
      }

      const eventData = await eventResponse.json();
      setEventDetails(eventData);
      const deviceId = eventData.deviceId || selectedEvent.deviceId;
      const eventTime = new Date(eventData.eventTime || selectedEvent.eventTime);
      const from = new Date(eventTime);
      from.setHours(0, 0, 0, 0);
      const to = new Date(eventTime);
      to.setHours(23, 59, 59, 999);
      const tripsQuery = new URLSearchParams({
        deviceId,
        from: from.toISOString(),
        to: to.toISOString(),
      });

      const tripsResponse = await fetch(`/api/reports/trips?${tripsQuery.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        setTrips(tripsData);

        // Fetch route data for each trip if needed
        if (tripsData.length > 0) {
          const firstTrip = tripsData[0];
          const routeQuery = new URLSearchParams({
            deviceId,
            from: firstTrip.startTime,
            to: firstTrip.endTime,
          });

          const routeResponse = await fetch(`/api/reports/route?${routeQuery.toString()}`, {
            headers: { Accept: 'application/json' },
          });

          if (routeResponse.ok) {
            const routeData = await routeResponse.json();
            setRoute(routeData);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    fetchData();
  }, [selectedEvent]);

  const renderMediaContent = () => {
    if (!selectedEvent) {
      return <PlayCircleOutlineIcon sx={{ fontSize: 100, color: '#555' }} />;
    }

    const isImage = selectedEvent.mediaType === 'image' && selectedEvent.url;
    const isVideo = selectedEvent.mediaType === 'video' && selectedEvent.url;

    if (isImage) {
      return (
        <img
          src={selectedEvent.url}
          alt={selectedEvent.fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      );
    }

    if (isVideo) {
      return (
        <video
          src={selectedEvent.url}
          controls
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        >
          <track kind="captions" />
        </video>
      );
    }

    return <PlayCircleOutlineIcon sx={{ fontSize: 100, color: '#555' }} />;
  };

  const createMarkers = (route) => {
    if (!route || route.length === 0) return [];
    const first = route[0];
    const last = route[route.length - 1];

    return [
      { latitude: first.latitude, longitude: first.longitude, image: 'start-success' },
      { latitude: last.latitude, longitude: last.longitude, image: 'finish-error' },
    ];
  };

  const eventDate = selectedEvent?.eventTime
    ? new Date(selectedEvent.eventTime).toLocaleDateString()
    : '';

  const eventDateTime = selectedEvent?.eventTime
    ? new Date(selectedEvent.eventTime).toLocaleString()
    : '';

  if (loading) {
    return (
      <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportMediaDetails']}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 400,
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Loading media details...
          </Typography>
        </Box>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportMediaDetails']}>
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Typography
            variant="body2"
            color="primary"
            sx={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/reports/event')}
          >
            ← Go back to Media Events
          </Typography>
        </Box>
      </PageLayout>
    );
  }

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportMediaDetails']}>
      <div className={classes.container}>
        <div className={classes.containerMain} style={{ padding: '16px' }}>
          {/* Video/Image Player Section */}
          <Paper
            sx={{
              backgroundColor: '#1e1e1e',
              borderRadius: 2,
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              mb: 2,
            }}
          >
            {renderMediaContent()}
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: 10,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: 14,
              }}
            >
              {selectedEvent?.fileName || 'Media File'}
            </Box>
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                bgcolor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              {eventDateTime}
            </Box>
          </Paper>

          <Paper sx={{ height: 500, position: 'relative', overflow: 'hidden', borderRadius: 2, mb: 2 }}>
            <MapView>
              <MapGeofence />
              {route && route.length > 0 && (
              <>
                <MapRoutePath positions={route} />
                <MapMarkers markers={createMarkers(route)} />
                <MapCamera positions={route} />
              </>
              )}
            </MapView>
            <MapScale />
          </Paper>

          {/* Trips Table Section */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Trips on
              {' '}
              {eventDate}
            </Typography>

            {trips.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  No trips found for this day.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell className={classes.columnAction} />
                      {columns.map((col) => (
                        <TableCell key={col}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.startPositionId}>
                        <TableCell className={classes.columnAction} padding="none">
                          <IconButton size="small">
                            <GpsFixedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                        {columns.map((col) => {
                          const isTimeColumn = col.includes('Time');
                          const value = trip[col];
                          const displayValue = isTimeColumn && value
                            ? new Date(value).toLocaleString()
                            : value || '-';
                          return <TableCell key={col}>{displayValue}</TableCell>;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Paper>
        </div>
      </div>
    </PageLayout>
  );
};

export default MediaDetailsPage;
