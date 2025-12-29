import React, {
  useState,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
} from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import { useSelector } from 'react-redux';
import {
  formatTime,
  formatDistance,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference } from '../common/util/preferences';
import scheduleReport from './common/scheduleReport';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapPositions from '../map/MapPositions';
import MapCamera from '../map/MapCamera';
import MapScale from '../map/MapScale';
import useResizableMap from './common/useResizableMap';

const columnsArray = [
  ['deviceId', 'sharedDevice'],
  ['geofenceId', 'sharedGeofence'],
  ['type', 'sharedType'],
  ['startTime', 'reportStartTime'],
  ['endTime', 'reportEndTime'],
  ['totalDistance', 'sharedTotalDistance'],
  ['startDistance', 'sharedStartDistance'],
  ['endDistance', 'sharedEndDistance'],
  ['distanceTraveled', 'sharedDistanceTraveled'],
];

const columnsMap = new Map(columnsArray);

const allEventTypes = [
  ['allTypes', 'sharedAll'],
  ['Inside', 'inside'],
  ['Outside', 'outside'],
];

const segmentTypes = [
  ['all', 'All Segments'],
  ['open', 'Open Segments Only'],
  ['reentry', 'Re-Entries Only'],
];

const GeofenceDistanceReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();
  const { containerRef, mapHeight, handleMouseDown } = useResizableMap(60, 20, 80);

  const devices = useSelector((state) => state.devices.items);

  const distanceUnit = useAttributePreference('distanceUnit');
  const [filterRange, setFilterRange] = useState({ from: null, to: null });

  const [columns, setColumns] = usePersistedState('geofenceDistanceColumns', [
    'deviceId',
    'geofenceId',
    'startTime',
    'endTime',
    'type',
    'totalDistance',
    'startDistance',
    'endDistance',
    'distanceTraveled',
  ]);

  const [items, setItems] = useState([]);
  const [geofences, setGeofences] = useState({});
  const [allGeofences, setAllGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['allTypes']);
  const [selectedSegmentType, setSelectedSegmentType] = useState('all');
  const [selectedGeofences, setSelectedGeofences] = useState(['allGeofences']);
  const [minDistance, setMinDistance] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const fetchGeofences = async () => {
      try {
        const response = await fetch('/api/geofences', {
          headers: { Accept: 'application/json' },
        });
        if (response.ok) {
          const data = await response.json();
          const geofenceMap = {};
          data.forEach((geofence) => {
            geofenceMap[geofence.id] = geofence;
          });
          setGeofences(geofenceMap);
          setAllGeofences(data);
        }
      } catch (error) {
        console.error('Error fetching geofences:', error);
      }
    };

    fetchGeofences();
  }, []);

  useEffectAsync(async () => {
    if (selectedItem) {
      const response = await fetch(
        `/api/positions?id=${selectedItem.positionId}`,
      );
      if (response.ok) {
        const positions = await response.json();
        if (positions.length > 0) {
          setPosition(positions[0]);
        }
      } else {
        throw Error(await response.text());
      }
    } else {
      setPosition(null);
    }
  }, [selectedItem]);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });

    if (selectedTypes[0] !== 'allTypes') {
      selectedTypes.forEach((eventType) => query.append('type', eventType));
    }

    if (type === 'export') {
      window.location.assign(`/api/reports/devicegeofencedistances/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(
        `/api/reports/devicegeofencedistances/mail?${query.toString()}`,
      );
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/devicegeofencedistances?${query.toString()}`,
          {
            headers: { Accept: 'application/json' },
          },
        );
        if (response.ok) {
          let data = await response.json();

          if (selectedTypes[0] !== 'allTypes') {
            data = data.filter((item) => selectedTypes.includes(item.type));
          }

          if (selectedSegmentType === 'open') {
            data = data.filter((item) => item.open === true);
          } else if (selectedSegmentType === 'reentry') {
            data = data.filter((item) => item.open === false);
          }

          if (minDistance && !Number.isNaN(parseFloat(minDistance))) {
            const minDistanceMeters = parseFloat(minDistance) * 1000;
            data = data.filter((item) => item.distance >= minDistanceMeters);
          }

          if (selectedGeofences[0] !== 'allGeofences') {
            const selectedGeofenceIds = selectedGeofences.map(Number);
            const existingData = data.filter((item) => selectedGeofenceIds.includes(item.geofenceId));

            const existingGeofenceIds = new Set(existingData.map((item) => item.geofenceId));
            const missingGeofenceIds = selectedGeofenceIds.filter(
              (id) => !existingGeofenceIds.has(id),
            );

            const placeholderRows = missingGeofenceIds.map((geofenceId, index) => ({
              id: `placeholder-${geofenceId}-${index}`,
              deviceId,
              geofenceId,
              type: 'N/A',
              startTime: null,
              endTime: null,
              distance: 0,
              odoStart: 0,
              odoEnd: 0,
              isPlaceholder: true,
            }));

            data = [...existingData, ...placeholderRows];
          }

          setItems(data);
          setFilterRange({ from, to });
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'geofence-distance';
    const error = await scheduleReport(deviceIds, groupIds, report);
    if (error) {
      throw Error(error);
    } else {
      navigate('/reports/scheduled');
    }
  });

  const formatValue = (item, key) => {
    if (item.isPlaceholder) {
      switch (key) {
        case 'deviceId':
          return devices[item.deviceId]?.name || item.deviceId;
        case 'geofenceId':
          return geofences[item.geofenceId]?.name || item.geofenceId;
        case 'type':
        case 'startTime':
        case 'endTime':
        case 'totalDistance':
        case 'startDistance':
        case 'endDistance':
        case 'distanceTraveled':
          return 'N/A';
        default:
          return 'N/A';
      }
    }

    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;

      case 'geofenceId':
        return geofences[value]?.name || value;

      case 'startTime':
        return item.startTime
          ? formatTime(item.startTime, 'minutes')
          : 'N/A';

      case 'endTime':
        return item.endTime
          ? formatTime(item.endTime, 'minutes')
          : 'N/A';

      case 'type':
        if (value === 'enter') return t('geofenceEnter');
        if (value === 'exit') return t('geofenceExit');
        if (value === 'Inside') return 'Inside';
        return value;

      case 'totalDistance':
        if (item.distance !== null && item.distance !== undefined) {
          return formatDistance(item.distance, distanceUnit, t);
        }
        return 'N/A';

      case 'startDistance':
        if (item.odoStart !== null && item.odoStart !== undefined) {
          return formatDistance(item.odoStart, distanceUnit, t);
        }
        return 'N/A';

      case 'endDistance':
        if (item.odoEnd !== null && item.odoEnd !== undefined) {
          return formatDistance(item.odoEnd, distanceUnit, t);
        }
        return 'N/A';

      case 'distanceTraveled':
        if (item.distance !== null && item.distance !== undefined) {
          return formatDistance(item.distance, distanceUnit, t);
        }
        return 'N/A';

      default:
        return value;
    }
  };

  const hasPositionIds = items.some((item) => item.positionId);

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={['reportTitle', 'reportGeofenceDistance']}
    >
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

            <button
              type="button"
              aria-label="Resize map"
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
          <div className={classes.containerMain}>
            <div className={classes.header}>
              <ReportFilter
                handleSubmit={handleSubmit}
                handleSchedule={handleSchedule}
                loading={loading}
              >
                <div className={classes.filterItem}>
                  <FormControl fullWidth>
                    <InputLabel>Segment Type</InputLabel>
                    <Select
                      label="Segment Type"
                      value={selectedSegmentType}
                      onChange={(e) => setSelectedSegmentType(e.target.value)}
                    >
                      {segmentTypes.map(([key, label]) => (
                        <MenuItem key={key} value={key}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
                <div className={classes.filterItem}>
                  <TextField
                    fullWidth
                    label="Minimum Distance (km)"
                    type="number"
                    value={minDistance}
                    onChange={(e) => setMinDistance(e.target.value)}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </div>
                <div className={classes.filterItem}>
                  <FormControl fullWidth>
                    <InputLabel>{t('sharedType')}</InputLabel>
                    <Select
                      label={t('sharedType')}
                      value={selectedTypes}
                      onChange={(e, child) => {
                        let values = e.target.value;
                        const clicked = child.props.value;
                        if (values.includes('allTypes') && values.length > 1) {
                          values = [clicked];
                        }
                        setSelectedTypes(values);
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
                <div className={classes.filterItem}>
                  <FormControl fullWidth>
                    <InputLabel>{t('sharedGeofence')}</InputLabel>
                    <Select
                      label={t('sharedGeofence')}
                      value={selectedGeofences}
                      onChange={(e, child) => {
                        let values = e.target.value;
                        const clicked = child.props.value;
                        if (values.includes('allGeofences') && values.length > 1) {
                          values = [clicked];
                        }
                        setSelectedGeofences(values);
                      }}
                      multiple
                    >
                      <MenuItem key="allGeofences" value="allGeofences">
                        All Geofences
                      </MenuItem>
                      {allGeofences.map((geofence) => (
                        <MenuItem key={geofence.id} value={geofence.id.toString()}>
                          {geofence.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </div>
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
                  {hasPositionIds && <TableCell className={classes.columnAction} />}
                  {columns.map((key) => (
                    <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      {hasPositionIds && (
                        <TableCell className={classes.columnAction} padding="none">
                          {item.positionId && (
                            selectedItem === item ? (
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
                            )
                          )}
                        </TableCell>
                      )}
                      {columns.map((key) => (
                        <TableCell key={key}>{formatValue(item, key)}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableShimmer columns={columns.length + (hasPositionIds ? 1 : 0)} />
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default GeofenceDistanceReportPage;
