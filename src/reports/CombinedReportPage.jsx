import React, { useMemo, useState, useCallback } from 'react';
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
import MapPositions from '../map/MapPositions';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';
import StatusCard from '../common/components/StatusCard';
import useResizableMap from './common/useResizableMap';

const CombinedReportPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [selectedPositionId, setSelectedPositionId] = useState(null);

  const { containerRef, mapHeight, handleMouseDown } = useResizableMap(60, 20, 80);

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const markerPositions = useMemo(() => items.flatMap((item) => item.events
    .map((event) => item.positions.find((p) => event.positionId === p.id))
    .filter((position) => position != null)), [items]);

  const selectedPositionData = useMemo(() => {
    if (!selectedPositionId) return null;

    const foundItem = items.find((item) => item.positions.some((p) => p.id === selectedPositionId));

    if (!foundItem) {
      return undefined;
    }

    return {
      position: foundItem.positions.find((p) => p.id === selectedPositionId),
      deviceId: foundItem.deviceId,
    };
  }, [selectedPositionId, items]);

  const onMarkerClick = useCallback((positionId) => {
    setSelectedPositionId(positionId);
    setShowCard(!!positionId);
  }, []);

  const handleSubmit = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/combined?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  const statusCardStyles = {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    right: '16px',
    maxWidth: '400px',
    zIndex: 1000,
    pointerEvents: 'auto',
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
                <MapPositions
                  positions={markerPositions}
                  onClick={onMarkerClick}
                  titleField="fixTime"
                />
              </MapView>
              <MapScale />
              <MapCamera coordinates={itemsCoordinates} />

              {showCard && selectedPositionData && (
                <StatusCard
                  deviceId={selectedPositionData.deviceId}
                  position={selectedPositionData.position}
                  onClose={() => setShowCard(false)}
                  disableActions
                  hideCardActions
                  customStyles={statusCardStyles}
                />
              )}
            </div>

            <div
              style={{
                height: '8px',
                position: 'relative',
                flexShrink: 0,
                pointerEvents: 'none',
              }}
            >
              <button
                aria-label="button"
                type="button"
                onMouseDown={handleMouseDown}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  backgroundColor: '#e0e0e0',
                  cursor: 'row-resize',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTop: '1px solid #ccc',
                  borderBottom: '1px solid #ccc',
                  border: 'none',
                  pointerEvents: 'auto',
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
            </div>
          </>
        )}

        <div
          className={classes.containerMain}
          style={{
            flex: 1,
            overflow: 'auto',
            minHeight: '150px',
            position: 'relative',
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
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;
