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
} from '@mui/material';
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
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference } from '../common/util/preferences';
import scheduleReport from './common/scheduleReport';

const columnsArray = [
  ['deviceId', 'sharedDevice'],
  ['geofenceId', 'sharedGeofence'],
  ['startTime', 'reportStartTime'],
  ['endTime', 'reportEndTime'],
  ['type', 'sharedType'],
  ['totalDistance', 'sharedTotalDistance'],
  ['startDistance', 'sharedStartDistance'],
  ['endDistance', 'sharedEndDistance'],
  ['distanceTraveled', 'sharedDistanceTraveled'],
];

const columnsMap = new Map(columnsArray);

const allEventTypes = [
  ['allTypes', 'sharedAll'],
  ['enter', 'geofenceEnter'],
  ['exit', 'geofenceExit'],
];

const GeofenceDistanceReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

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
  const [loading, setLoading] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['allTypes']);

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
        }
      } catch (error) {
        console.error('Error fetching geofences:', error);
      }
    };

    fetchGeofences();
  }, []);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });

    // Add type filters if not "all"
    if (selectedTypes[0] !== 'allTypes') {
      selectedTypes.forEach((eventType) => query.append('type', eventType));
    }

    if (type === 'export') {
      window.location.assign(`/api/devicegeofencedistances/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(
        `/api/devicegeofencedistances/mail?${query.toString()}`,
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

          // Client-side filtering if API doesn't filter
          if (selectedTypes[0] !== 'allTypes') {
            data = data.filter((item) => selectedTypes.includes(item.type));
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
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;

      case 'geofenceId':
        return geofences[value]?.name || value;

      case 'startTime':
        return filterRange.from
          ? formatTime(filterRange.from, 'minutes')
          : 'N/A';

      case 'endTime':
        return filterRange.to
          ? formatTime(filterRange.to, 'minutes')
          : 'N/A';

      case 'type':
        if (value === 'enter') return t('geofenceEnter');
        if (value === 'exit') return t('geofenceExit');
        return value;

      case 'totalDistance':
      case 'startDistance':
      case 'endDistance':
        if (value === null || value === undefined) return 'N/A';
        return formatDistance(value, distanceUnit, t);

      case 'distanceTraveled':
        if (item.startDistance !== null && item.endDistance !== null) {
          const distanceTraveled = item.endDistance - item.startDistance;
          return formatDistance(distanceTraveled, distanceUnit, t);
        }
        return 'N/A';

      default:
        return value;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={['reportTitle', 'reportGeofenceDistance']}
    >
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            >
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
                {columns.map((key) => (
                  <TableCell key={key}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((key) => (
                      <TableCell key={key}>{formatValue(item, key)}</TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableShimmer columns={columns.length} />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </PageLayout>
  );
};

export default GeofenceDistanceReportPage;
