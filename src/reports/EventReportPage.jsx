import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  IconButton,
  Paper,
  Toolbar,
  Typography,
  Slider,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import PauseIcon from '@mui/icons-material/Pause';
import CloseIcon from '@mui/icons-material/Close';
import { useSelector } from 'react-redux';
import {
  formatSpeed,
  formatTime,
  formatDistance,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import {
  useTranslation,
  useTranslationKeys,
} from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference } from '../common/util/preferences';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapCamera from '../map/MapCamera';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import SelectField from '../common/components/SelectField';
import StatusCard from '../common/components/StatusCard';

const columnsArray = [
  ['eventTime', 'positionFixTime'],
  ['type', 'sharedType'],
  ['geofenceId', 'sharedGeofence'],
  ['maintenanceId', 'sharedMaintenance'],
  ['attributes', 'commandData'],
  ['speedLimit', 'attributeSpeedLimit'],
];

const filterEvents = (events, typesToExclude) => {
  const excludeSet = new Set(typesToExclude);
  const data = events.filter((event) => !excludeSet.has(event.type));
  return data;
};

const columnsMap = new Map(columnsArray);

const EventReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();
  const timerRef = useRef();

  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  const [allEventTypes, setAllEventTypes] = useState([
    ['allEvents', 'eventAll'],
  ]);

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map(
    (it) => ({
      key: unprefixString('alarm', it),
      name: t(it),
    })
  );

  const [columns, setColumns] = usePersistedState('eventColumns', [
    'eventTime',
    'type',
    'attributes',
    'speedLimit',
  ]);
  const [eventTypes, setEventTypes] = useState(['allEvents']);
  const [alarmTypes, setAlarmTypes] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [position, setPosition] = useState(null);
  const [replayMode, setReplayMode] = useState(false);
  const [replayPositions, setReplayPositions] = useState([]);
  const [replayIndex, setReplayIndex] = useState(0);
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const [eventPosition, setEventPosition] = useState(null);
  const [showCard, setShowCard] = useState(false);

  const deviceName = useSelector((state) => {
    if (selectedItem?.deviceId) {
      const device = state.devices.items[selectedItem.deviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  useEffect(() => {
    if (replayPlaying && replayPositions.length > 0) {
      timerRef.current = setInterval(() => {
        setReplayIndex((index) => index + 1);
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [replayPlaying, replayPositions]);

  useEffect(() => {
    if (replayIndex >= replayPositions.length - 1) {
      clearInterval(timerRef.current);
      setReplayPlaying(false);
    }
  }, [replayIndex, replayPositions]);

  useEffectAsync(async () => {
    if (selectedItem && !replayMode) {
      const response = await fetch(
        `/api/positions?id=${selectedItem.positionId}`
      );
      if (response.ok) {
        const positions = await response.json();
        if (positions.length > 0) {
          setPosition(positions[0]);
        }
      } else {
        throw Error(await response.text());
      }
    } else if (!selectedItem) {
      setPosition(null);
    }
  }, [selectedItem, replayMode]);

  useEffectAsync(async () => {
    const response = await fetch('/api/notifications/types');
    if (response.ok) {
      const types = await response.json();
      const FilteredTypes = [
        'deviceFuelDrop',
        'deviceFuelIncrease',
        'textMessage',
        'driverChanged',
        'media',
      ];
      const typeFiltered = types.filter(
        (item) => !FilteredTypes.includes(item.type)
      );
      setAllEventTypes([
        ...allEventTypes,
        ...typeFiltered.map((it) => [it.type, prefixString('event', it.type)]),
      ]);
    } else {
      throw Error(await response.text());
    }
  }, []);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    eventTypes.forEach((it) => query.append('type', it));
    if (eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm')) {
      alarmTypes.forEach((it) => query.append('alarm', it));
    }
    if (type === 'export') {
      window.location.assign(`/api/reports/events/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(
        `/api/reports/events/mail?${query.toString()}`
      );
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/reports/events?${query.toString()}`,
          {
            headers: { Accept: 'application/json' },
          }
        );
        if (response.ok) {
          const data = await response.json();
          const typesToExclude = ['deviceOnline', 'deviceUnknown'];
          const ModifiedData = data.map((item) => ({
            ...item,
            speedLimit: item.attributes?.speedLimit || null,
          }));
          const filteredEvents = filterEvents(ModifiedData, typesToExclude);
          setItems(filteredEvents);
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const findClosestPositionIndex = (positions, eventTime) => {
    if (!positions || positions.length === 0) return 0;

    const eventTimestamp = new Date(eventTime).getTime();
    let closestIndex = 0;
    let minDifference = Math.abs(
      new Date(positions[0].fixTime).getTime() - eventTimestamp
    );

    for (let i = 1; i < positions.length; i += 1) {
      const positionTimestamp = new Date(positions[i].fixTime).getTime();
      const difference = Math.abs(positionTimestamp - eventTimestamp);

      if (difference < minDifference) {
        minDifference = difference;
        closestIndex = i;
      }
    }

    return closestIndex;
  };

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'events';
    if (eventTypes[0] !== 'allEvents') {
      report.attributes.types = eventTypes.join(',');
    }
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    } else {
      navigate('/reports/scheduled');
    }
  });

  const handleReplayStart = useCatch(async (item) => {
    setReplayLoading(true);
    setReplayMode(true);
    setSelectedItem(item);

    try {
      const eventTime = new Date(item.eventTime);
      const fromTime = new Date(eventTime.getTime() - 60 * 60 * 1000);
      const toTime = new Date(eventTime.getTime() + 60 * 60 * 1000);
      const query = new URLSearchParams({
        deviceId: item.deviceId,
        from: fromTime.toISOString(),
        to: toTime.toISOString(),
      });

      console.log(query.toString());
      const response = await fetch(`/api/positions?${query.toString()}`);
      if (response.ok) {
        const positions = await response.json();
        console.log(positions);

        setReplayPositions(positions);
        const eventIndex = findClosestPositionIndex(positions, item.eventTime);
        setReplayIndex(eventIndex);
        const eventPositionResponse = await fetch(
          `/api/positions?id=${item.positionId}`
        );
        if (eventPositionResponse.ok) {
          const eventPositions = await eventPositionResponse.json();
          if (eventPositions.length > 0) {
            setEventPosition(eventPositions[0]);
          }
        }

        if (positions.length === 0) {
          throw Error(t('sharedNoData'));
        }
      } else {
        throw Error(await response.text());
      }
    } finally {
      setReplayLoading(false);
    }
  });

  const handleReplayStop = () => {
    setReplayMode(false);
    setReplayPositions([]);
    setReplayIndex(0);
    setReplayPlaying(false);
    setEventPosition(null);
    clearInterval(timerRef.current);
  };

  const onMarkerClick = useCallback(
    (positionId) => {
      setShowCard(!!positionId);
    },
    [setShowCard]
  );

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'eventTime':
        return formatTime(value, 'seconds');

      case 'type':
        return t(prefixString('event', value));

      case 'geofenceId':
        if (value > 0) {
          const geofence = geofences[value];
          return geofence && geofence.name;
        }
        return null;

      case 'maintenanceId':
        return value > 0 ? value : null;

      case 'speedLimit':
        if (item.type === 'deviceOverspeed' && item.attributes?.speedLimit) {
          return formatSpeed(item.attributes.speedLimit, speedUnit, t);
        }
        return null;

      case 'attributes':
        switch (item.type) {
          case 'alarm':
            return t(prefixString('alarm', item.attributes.alarm));

          case 'deviceOverspeed':
            return formatSpeed(item.attributes.speed, speedUnit, t);

          case 'driverChanged':
            return item.attributes.driverUniqueId;

          case 'media':
            return (
              <Link
                href={`/api/media/${devices[item.deviceId]?.uniqueId}/${
                  item.attributes.file
                }`}
                target="_blank"
              >
                {item.attributes.file}
              </Link>
            );

          case 'commandResult':
            return item.attributes.result;

          case 'deviceTollRouteExit': {
            let tollDetails = '';
            if ('tollName' in item.attributes) {
              tollDetails += `Toll name: ${item.attributes.tollName} | `;
            }
            if ('tollDistance' in item.attributes) {
              tollDetails += `Toll Distance: ${formatDistance(
                item.attributes.tollDistance,
                distanceUnit,
                t
              )}`;
            }
            return tollDetails;
          }

          case 'deviceTollRouteEnter': {
            let tollDetails = '';
            if ('tollName' in item.attributes) {
              tollDetails += `Toll name: ${item.attributes.tollName} | `;
            }
            if ('tollRef' in item.attributes) {
              tollDetails += `Toll Reference: ${item.attributes.tollRef} | `;
            }
            return tollDetails;
          }

          default:
            return '';
        }

      default:
        return value;
    }
  };

  if (replayMode) {
    return (
      <div style={{ height: '100%' }}>
        <MapView>
          <MapGeofence />
          <MapRoutePath positions={replayPositions} />
          <MapRoutePoints positions={replayPositions} />
          {eventPosition && (
            <MapPositions
              positions={[eventPosition]}
              onClick={onMarkerClick}
              titleField="tollName"
              customIcon="event-error"
            />
          )}
          {replayIndex < replayPositions.length && (
            <MapPositions
              positions={[replayPositions[replayIndex]]}
              onClick={onMarkerClick}
              // titleField="fixTime"
            />
          )}
        </MapView>
        <MapScale />
        <MapCamera positions={replayPositions} />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            zIndex: 3,
            left: 0,
            top: 0,
            margin: 12,
            width: 400,
          }}
        >
          <Paper elevation={3} square>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                {t('reportReplay')} - {deviceName}
              </Typography>
              <IconButton edge="end" onClick={handleReplayStop}>
                <CloseIcon />
              </IconButton>
            </Toolbar>
          </Paper>

          <Paper
            style={{ display: 'flex', flexDirection: 'column', padding: 16 }}
            square
          >
            <Typography variant="subtitle1" align="center">
              {formatTime(selectedItem?.eventTime, 'seconds')} -{' '}
              {t(prefixString('event', selectedItem?.type))}
            </Typography>

            <Slider
              style={{ width: '100%', margin: '16px 0' }}
              min={0}
              max={replayPositions.length - 1}
              step={1}
              value={replayIndex}
              onChange={(e, newValue) => {
                setReplayIndex(newValue);
                setReplayPlaying(false);
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: -15,
              }}
            >
              <Typography variant="caption">1hr before</Typography>
              <Typography variant="caption">1hr after</Typography>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{`${replayIndex + 1}/${replayPositions.length}`}</span>
              <IconButton
                onClick={() => setReplayIndex((i) => i - 1)}
                disabled={replayPlaying || replayIndex <= 0}
              >
                <FastRewindIcon />
              </IconButton>

              <IconButton
                onClick={() => setReplayPlaying(!replayPlaying)}
                disabled={replayIndex >= replayPositions.length - 1}
              >
                {replayPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>

              <IconButton
                onClick={() => setReplayIndex((i) => i + 1)}
                disabled={
                  replayPlaying || replayIndex >= replayPositions.length - 1
                }
              >
                <FastForwardIcon />
              </IconButton>
              <span>
                {replayIndex < replayPositions.length
                  ? formatTime(replayPositions[replayIndex].fixTime, 'seconds')
                  : ''}
              </span>
            </div>
          </Paper>
        </div>

        {showCard && replayIndex < replayPositions.length && (
          <StatusCard
            deviceId={selectedItem.deviceId}
            position={replayPositions[replayIndex]}
            onClose={() => setShowCard(false)}
            disableActions
          />
        )}
      </div>
    );
  }

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={['reportTitle', 'reportEvents']}
    >
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              {position && (
                <MapPositions positions={[position]} titleField="fixTime" />
              )}
            </MapView>
            <MapScale />
            {position && (
              <MapCamera
                latitude={position.latitude}
                longitude={position.longitude}
              />
            )}
          </div>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            >
              <div className={classes.filterItem}>
                <FormControl fullWidth>
                  <InputLabel>{t('reportEventTypes')}</InputLabel>
                  <Select
                    label={t('reportEventTypes')}
                    value={eventTypes}
                    onChange={(e, child) => {
                      let values = e.target.value;
                      const clicked = child.props.value;
                      if (values.includes('allEvents') && values.length > 1) {
                        values = [clicked];
                      }
                      setEventTypes(values);
                    }}
                    multiple
                  >
                    {allEventTypes.map(([key, string]) => (
                      <MenuItem key={key} value={key}>
                        {t(string)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {eventTypes[0] !== 'allEvents' &&
                eventTypes.includes('alarm') && (
                  <div className={classes.filterItem}>
                    <SelectField
                      multiple
                      value={alarmTypes}
                      onChange={(e) => setAlarmTypes(e.target.value)}
                      data={alarms}
                      keyGetter={(it) => it.key}
                      label={t('sharedAlarms')}
                      fullWidth
                    />
                  </div>
                )}
              <ColumnSelect
                columns={columns}
                setColumns={setColumns}
                columnsArray={columnsArray}
              />
            </ReportFilter>
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.columnAction} />
                <TableCell className={classes.columnAction} />
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className={classes.columnAction} padding="none">
                      {(item.positionId &&
                        (selectedItem === item ? (
                          <IconButton
                            size="small"
                            onClick={() => setSelectedItem(null)}
                          >
                            <GpsFixedIcon fontSize="small" />
                          </IconButton>
                        ) : (
                          <IconButton
                            size="small"
                            onClick={() => setSelectedItem(item)}
                          >
                            <LocationSearchingIcon fontSize="small" />
                          </IconButton>
                        ))) ||
                        ''}
                    </TableCell>
                    <TableCell className={classes.columnAction} padding="none">
                      {item.positionId && (
                        <IconButton
                          size="small"
                          onClick={() => handleReplayStart(item)}
                          disabled={replayLoading}
                        >
                          <ReplayIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length + 2} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default EventReportPage;
