import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton, Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import { useSelector } from 'react-redux';
import {
  formatDistance, formatSpeed, formatVolume, formatTime, formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import useResizableMap from './common/useResizableMap';
import MediaPreview from './components/MediaPreview';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'reportStartOdometer'],
  ['startAddress', 'reportStartAddress'],
  ['endTime', 'reportEndTime'],
  ['endOdometer', 'reportEndOdometer'],
  ['endAddress', 'reportEndAddress'],
  ['distance', 'sharedDistance'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['duration', 'reportDuration'],
  ['spentFuel', 'reportSpentFuel'],
  ['driverName', 'sharedDriver'],
];
const columnsMap = new Map(columnsArray);

const MediaBar = ({ mediaItems, devices, onMediaClick }) => (
  <Box
    sx={{
      display: 'flex',
      gap: 1.5,
      overflowX: 'auto',
      padding: 1.5,
      borderRadius: 1,
      '&::-webkit-scrollbar': {
        height: 8,
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: '#9e9e9e',
        borderRadius: 4,
        '&:hover': {
          backgroundColor: '#757575',
        },
      },
    }}
  >
    {mediaItems.map((mediaItem) => {
      const mediaUrl = `/api/media/${devices[mediaItem.deviceId]?.uniqueId}/${mediaItem.attributes.file}`;
      const filename = mediaItem.attributes.file;
      const isImage = isImageFile(filename);
      const isVideo = isVideoFile(filename);

      return (
        <Box
          key={mediaItem.id}
          onClick={() => onMediaClick(mediaUrl)}
          sx={{
            minWidth: 120,
            maxWidth: 120,
            height: 100,
            cursor: 'pointer',
            borderRadius: 1,
            overflow: 'hidden',
            border: '2px solid #e0e0e0',
            backgroundColor: '#fff',
            transition: 'all 0.2s',
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              borderColor: '#1976d2',
            },
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isImage && (
              <img
                src={mediaUrl}
                alt={filename}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            )}

            {isVideo && <VideoThumbnail url={mediaUrl} filename={filename} />}

            {!isImage && !isVideo && (
              <InsertDriveFileIcon sx={{ fontSize: 40, color: '#9e9e9e' }} />
            )}
          </Box>
          <Box
            sx={{
              padding: 0.5,
              backgroundColor: '#fff',
              borderTop: '1px solid #e0e0e0',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontSize: 10,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: '#666',
              }}
              title={filename}
            >
              {filename}
            </Typography>
          </Box>
        </Box>
      );
    })}
  </Box>
);

const TripReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();
  const { containerRef, mapHeight, handleMouseDown } = useResizableMap(60, 20, 80);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');
  const devices = useSelector((state) => state.devices.items);
  const [columns, setColumns] = usePersistedState('tripColumns', ['startTime', 'endTime', 'distance', 'averageSpeed']);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);
  const [tripMediaMap, setTripMediaMap] = useState({});
  const [openTrips, setOpenTrips] = useState({});
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState(null);

  const createMarkers = () => ([
    {
      latitude: selectedItem.startLat,
      longitude: selectedItem.startLon,
      image: 'start-success',
    },
    {
      latitude: selectedItem.endLat,
      longitude: selectedItem.endLon,
      image: 'finish-error',
    },
  ]);

  useEffectAsync(async () => {
    if (selectedItem) {
      const query = new URLSearchParams({
        deviceId: selectedItem.deviceId,
        from: selectedItem.startTime,
        to: selectedItem.endTime,
      });
      const response = await fetch(`/api/reports/route?${query.toString()}`, {
        headers: {
          Accept: 'application/json',
        },
      });
      if (response.ok) {
        setRoute(await response.json());
      } else {
        throw Error(await response.text());
      }
    } else {
      setRoute(null);
    }
  }, [selectedItem]);

  const fetchTripMedia = async (trip) => {
    const query = new URLSearchParams({
      deviceId: trip.deviceId,
      from: trip.startTime,
      to: trip.endTime,
      type: 'media',
    });

    const response = await fetch(`/api/reports/events?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const events = await response.json();
      if (events.length) {
        setTripMediaMap((prev) => ({
          ...prev,
          [trip.startPositionId]: events,
        }));
      }
    }
  };

  useEffect(() => {
    items.forEach((trip) => {
      fetchTripMedia(trip);
    });
  }, [items]);

  const toggleTrip = (tripId) => {
    setOpenTrips((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
  };

  const handleMediaClick = (url) => {
    setMediaPreviewUrl(url);
  };

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    if (type === 'export') {
      window.location.assign(`/api/reports/trips/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(`/api/reports/trips/mail?${query.toString()}`);
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(`/api/reports/trips?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          setItems(await response.json());
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'trips';
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    } else {
      navigate('/reports/scheduled');
    }
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'duration':
        return formatNumericHours(value, t);
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'startAddress':
        return (<AddressValue latitude={item.startLat} longitude={item.startLon} originalAddress={value} />);
      case 'endAddress':
        return (<AddressValue latitude={item.endLat} longitude={item.endLon} originalAddress={value} />);
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>
      <div
        ref={containerRef}
        className={classes.container}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)',
          overflow: 'hidden',
        }}
      >
        {selectedItem && (
        <>
          <div
            className={classes.containerMap}
            style={{
              height: `${mapHeight}%`,
              minHeight: '150px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <MapView>
              <MapGeofence />
              {route && (
              <>
                <MapRoutePath positions={route} />
                <MapMarkers markers={createMarkers()} />
                <MapCamera positions={route} />
              </>
              )}
            </MapView>
            <MapScale />
          </div>

          <button
            type="button"
            onMouseDown={handleMouseDown}
            style={{
              height: '8px',
              backgroundColor: '#e0e0e0',
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              borderTop: '1px solid #ccc',
              borderBottom: '1px solid #ccc',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d0d0d0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e0e0e0')}
          >
            {' '}
            <div
              style={{
                width: '40px',
                height: '4px',
                backgroundColor: '#999',
                borderRadius: '2px',
              }}
            />
          </button>
        </>
        )}

        <div
          className={classes.containerMain}
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: '150px',
          }}
        >
          <div className={classes.header}>
            <ReportFilter handleSubmit={handleSubmit} handleSchedule={handleSchedule} loading={loading}>
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.columnAction} />
                {columns.map((key) => (<TableCell key={key}>{t(columnsMap.get(key))}</TableCell>))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? items.map((item) => {
                const media = tripMediaMap[item.startPositionId] || [];
                const isOpen = openTrips[item.startPositionId];

                return (
                  <React.Fragment key={item.startPositionId}>
                    <TableRow>
                      <TableCell className={classes.columnAction} padding="none">
                        {selectedItem === item ? (
                          <IconButton size="small" onClick={() => setSelectedItem(null)}>
                            <GpsFixedIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton size="small" onClick={() => setSelectedItem(item)}>
                            <LocationSearchingIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>

                      {columns.map((key, index) => (
                        <TableCell key={key}>
                          {index === 0 && media.length > 0 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton
                                size="small"
                                onClick={() => toggleTrip(item.startPositionId)}
                              >
                                {isOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                              </IconButton>
                              {formatValue(item, key)}
                            </Box>
                          ) : (
                            formatValue(item, key)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>

                    {media.length > 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        style={{ padding: 0 }}
                      >
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 2, marginLeft: 6 }}>
                            <MediaBar
                              mediaItems={media}
                              devices={devices}
                              onMediaClick={handleMediaClick}
                            />
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                    )}
                  </React.Fragment>
                );
              }) : (
                <TableShimmer columns={columns.length + 1} startAction />
              )}

            </TableBody>
          </Table>
        </div>
      </div>

      <MediaPreview
        open={!!mediaPreviewUrl}
        mediaUrl={mediaPreviewUrl}
        onClose={() => setMediaPreviewUrl(null)}
      />

    </PageLayout>
  );
};

export default TripReportPage;
