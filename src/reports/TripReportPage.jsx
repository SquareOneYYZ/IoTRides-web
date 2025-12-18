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

const EventsTable = ({ events, t }) => {
  if (!events || events.length === 0) {
    return (
      <Box sx={{ padding: 2, textAlign: 'center', color: '#666' }}>
        No events found for this trip
      </Box>
    );
  }

  return (
    <Box sx={{ margin: 2, marginLeft: 6 }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
            <TableCell sx={{ fontWeight: 600 }}>Fix Time</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Speed Limit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} hover>
              <TableCell>
                {formatTime(event.eventTime, 'seconds')}
              </TableCell>
              <TableCell>
                {event.type || 'N/A'}
              </TableCell>
              <TableCell>
                {event.attributes && Object.keys(event.attributes).length > 0 ? (
                  <Box>
                    {Object.entries(event.attributes).map(([key, value]) => (
                      <Box key={key} sx={{ fontSize: '0.875rem' }}>
                        <strong>
                          {key}
                          :
                        </strong>
                        {' '}
                        {String(value)}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  'N/A'
                )}
              </TableCell>
              <TableCell>
                {event.attributes?.speedLimit || 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

const TripReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();
  const { containerRef, mapHeight, handleMouseDown } = useResizableMap(60, 20, 80);
  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('tripColumns', ['startTime', 'endTime', 'distance', 'averageSpeed']);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);
  const [tripEventsMap, setTripEventsMap] = useState({});
  const [openTrips, setOpenTrips] = useState({});

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

  const fetchTripEvents = async (trip) => {
    const query = new URLSearchParams({
      deviceId: trip.deviceId,
      from: trip.startTime,
      to: trip.endTime,
    });

    try {
      const response = await fetch(`/api/reports/events?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });

      if (response.ok) {
        const events = await response.json();
        setTripEventsMap((prev) => ({
          ...prev,
          [trip.startPositionId]: events,
        }));
      }
    } catch (error) {
      console.error('Error fetching events for trip:', error);
    }
  };

  useEffect(() => {
    items.forEach((trip) => {
      fetchTripEvents(trip);
    });
  }, [items]);

  const toggleTrip = (tripId) => {
    setOpenTrips((prev) => ({
      ...prev,
      [tripId]: !prev[tripId],
    }));
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
                const events = tripEventsMap[item.startPositionId] || [];
                const isOpen = openTrips[item.startPositionId];
                const hasEvents = events.length > 0;

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
                          {index === 0 && hasEvents ? (
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

                    {hasEvents && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + 1}
                        style={{ padding: 0 }}
                      >
                        <Collapse in={isOpen} timeout="auto" unmountOnExit>
                          <EventsTable events={events} t={t} />
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
    </PageLayout>
  );
};

export default TripReportPage;
