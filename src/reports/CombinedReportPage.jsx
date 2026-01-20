import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Table, TableBody, TableCell, TableHead, TableRow,
} from '@mui/material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import { formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import useResizableMap from './common/useResizableMap';
import RecentReportsWrapper from './components/RecentReportWrapper';
import { saveReportToHistory, getPeriodLabel } from './components/ReportUtils';

const CombinedReportPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const userId = useSelector((state) => state.session.user?.id || 1);
  const { containerRef, mapHeight, handleMouseDown } = useResizableMap(60, 20, 80);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const createMarkers = () => items.flatMap((item) => item.events
    .map((event) => item.positions.find((p) => event.positionId === p.id))
    .filter((position) => position != null)
    .map((position) => ({
      latitude: position.latitude,
      longitude: position.longitude,
    })));

  const handleSubmit = useCatch(async ({ deviceIds, groupIds, from, to }, options = {}) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/combined?${query.toString()}`);

      if (!response.ok) {
        throw Error(await response.text());
      }

      const data = await response.json();
      setItems(data);

      if (!options.skipHistorySave) {
        await saveReportToHistory({
          userId,
          reportType: 'combined',
          deviceIds,
          groupIds,
          from,
          to,
          period: getPeriodLabel(from, to),
          additionalParams: {},
        });
      }
    } finally {
      setLoading(false);
    }
  });

  const handleReRunReport = (config) => {
    if (!config) {
      console.error('No config provided');
      return;
    }

    if (!config.from || !config.to) {
      console.error('Missing dates in config');
      return;
    }

    // IMPORTANT: Always pass skipHistorySave when re-running
    handleSubmit(
      {
        deviceIds: config.deviceIds || [],
        groupIds: config.groupIds || [],
        from: config.from,
        to: config.to,
      },
      { skipHistorySave: true }, // Don't save when viewing saved reports
    );
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
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
        {Boolean(items.length) && (
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
                {items.map((item) => (
                  <MapRouteCoordinates
                    key={item.deviceId}
                    name={devices[item.deviceId].name}
                    coordinates={item.route}
                    deviceId={item.deviceId}
                  />
                ))}
                <MapMarkers markers={createMarkers()} />
              </MapView>
              <MapScale />
              <MapCamera coordinates={itemsCoordinates} />
            </div>

            <button
              type="button"
              aria-label="resize"
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
              }}
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
          <div className={classes.header}>
            <ReportFilter
              handleSubmit={handleSubmit}
              showOnly
              multiDevice
              includeGroups
              loading={loading}
            />
          </div>

          {!loading && items.length === 0 && (
            <RecentReportsWrapper
              reportType="combined"
              onReRunReport={handleReRunReport}
            />
          )}

          {items.length > 0 && (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('sharedDevice')}</TableCell>
                  <TableCell>{t('positionFixTime')}</TableCell>
                  <TableCell>{t('sharedType')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.flatMap((item) => item.events.map((event, index) => (
                    <TableRow key={event.id}>
                      <TableCell>{index ? '' : devices[item.deviceId].name}</TableCell>
                      <TableCell>{formatTime(event.eventTime, 'seconds')}</TableCell>
                      <TableCell>{t(prefixString('event', event.type))}</TableCell>
                    </TableRow>
                  )))
                ) : (
                  <TableShimmer columns={3} />
                )}
              </TableBody>
            </Table>
          )}

          {loading && items.length === 0 && (
            <TableShimmer columns={3} />
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;
