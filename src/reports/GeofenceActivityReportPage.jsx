import React, {
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
  ['distance', 'sharedDistance'],
  ['startOdometer', 'reportStartOdometer'],
  ['endOdometer', 'reportEndOdometer'],
];

const columnsMap = new Map(columnsArray);

const GeofenceActivityReportPage = () => {
  const navigate = useNavigate();
  const classes = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);
  const geofences = useSelector((state) => state.geofences.items);

  const distanceUnit = useAttributePreference('distanceUnit');

  const [columns, setColumns] = usePersistedState('geofenceActivityColumns', [
    'deviceId',
    'geofenceId',
    'startTime',
    'endTime',
    'type',
    'distance',
    'startOdometer',
    'endOdometer',
  ]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCatch(async ({ deviceId, from, to, type }) => {
    const query = new URLSearchParams({ deviceId, from, to });

    if (type === 'export') {
      window.location.assign(`/api/reports/geofence-activity/xlsx?${query.toString()}`);
    } else if (type === 'mail') {
      const response = await fetch(
        `/api/reports/geofence-activity/mail?${query.toString()}`,
      );
      if (!response.ok) {
        throw Error(await response.text());
      }
    } else {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/reports/geofence-activity?${query.toString()}`,
          {
            headers: { Accept: 'application/json' },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setItems(data);
        } else {
          throw Error(await response.text());
        }
      } finally {
        setLoading(false);
      }
    }
  });

  const handleSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'geofence-activity';
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
      case 'endTime':
        return formatTime(value, 'seconds');

      case 'type':
        // Map type values to display text
        if (value === 'within') return 'Within Geofence';
        if (value === 'entered') return 'Entered Geofence';
        if (value === 'exited') return 'Exited Geofence';
        return value;

      case 'distance':
        return formatDistance(value, distanceUnit, t);

      case 'startOdometer':
      case 'endOdometer':
        return formatDistance(value, distanceUnit, t);

      default:
        return value;
    }
  };

  return (
    <PageLayout
      menu={<ReportsMenu />}
      breadcrumbs={['reportTitle', 'reportGeofenceActivity']}
    >
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              handleSchedule={handleSchedule}
              loading={loading}
            >
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
                  <TableRow key={`${item.deviceId}-${item.geofenceId}-${item.startTime}`}>
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

export default GeofenceActivityReportPage;
