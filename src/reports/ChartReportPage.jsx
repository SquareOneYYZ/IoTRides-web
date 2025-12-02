import dayjs from 'dayjs';
import React, { useState, useMemo } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, useTheme, Button, ButtonGroup, Box, Typography,
} from '@mui/material';
import {
  Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import {
  altitudeFromMeters, distanceFromMeters, speedFromKnots, volumeFromLiters,
} from '../common/util/converter';
import useReportStyles from './common/useReportStyles';

const ChartReportPage = () => {
  const classes = useReportStyles();
  const theme = useTheme();
  const t = useTranslation();

  const positionAttributes = usePositionAttributes(t);

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['speed']);
  const [selectedTypes, setSelectedTypes] = useState(['speed']);
  const [timeType, setTimeType] = useState('fixTime');
  const [brushDomain, setBrushDomain] = useState(null);
  const [zoomLevel, setZoomLevel] = useState('all');

  // CHANGE 1: Improved aggregation - preserves time accuracy
  const aggregateData = (data, maxPoints = 200) => {
    if (data.length <= maxPoints) return data;
    const interval = Math.ceil(data.length / maxPoints);
    const result = [];
    for (let i = 0; i < data.length; i += interval) {
      const chunk = data.slice(i, i + interval);
      // Keep first point to preserve time accuracy
      result.push(chunk[0]);
    }
    return result;
  };

  const displayData = useMemo(() => aggregateData(items), [items]);

  // CHANGE 2: Wrapped in useMemo to prevent recalculation on every render
  const { minValue, maxValue, valueRange } = useMemo(() => {
    const vals = displayData.flatMap((it) => selectedTypes.map((type) => it[type]).filter((v) => v != null));
    const min = vals.length ? Math.min(...vals) : 0;
    const max = vals.length ? Math.max(...vals) : 100;
    return { minValue: min, maxValue: max, valueRange: max - min };
  }, [displayData, selectedTypes]);

  // CHANGE 3: Calculate data timespan for button validation
  const dataTimespan = useMemo(() => {
    if (displayData.length === 0) return 0;
    const firstTime = displayData[0][timeType];
    const lastTime = displayData[displayData.length - 1][timeType];
    return lastTime - firstTime;
  }, [displayData, timeType]);

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    const query = new URLSearchParams({ deviceId, from, to });
    const response = await fetch(`/api/reports/route?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const positions = await response.json();
      const keySet = new Set();
      const keyList = [];
      const formattedPositions = positions.map((position) => {
        const data = { ...position, ...position.attributes };
        const formatted = {};
        formatted.fixTime = dayjs(position.fixTime).valueOf();
        formatted.deviceTime = dayjs(position.deviceTime).valueOf();
        formatted.serverTime = dayjs(position.serverTime).valueOf();
        Object.keys(data).filter((key) => !['id', 'deviceId'].includes(key)).forEach((key) => {
          const value = data[key];
          if (typeof value === 'number') {
            keySet.add(key);
            const definition = positionAttributes[key] || {};
            switch (definition.dataType) {
              case 'speed':
                formatted[key] = speedFromKnots(value, speedUnit).toFixed(2);
                break;
              case 'altitude':
                formatted[key] = altitudeFromMeters(value, altitudeUnit).toFixed(2);
                break;
              case 'distance':
                formatted[key] = distanceFromMeters(value, distanceUnit).toFixed(2);
                break;
              case 'volume':
                formatted[key] = volumeFromLiters(value, volumeUnit).toFixed(2);
                break;
              case 'hours':
                formatted[key] = (value / 1000).toFixed(2);
                break;
              default:
                formatted[key] = value;
                break;
            }
          }
        });
        return formatted;
      });
      Object.keys(positionAttributes).forEach((key) => {
        if (keySet.has(key)) {
          keyList.push(key);
          keySet.delete(key);
        }
      });
      setTypes([...keyList, ...keySet]);
      setItems(formattedPositions);
      setBrushDomain(null);
      setZoomLevel('all');
    } else {
      throw Error(await response.text());
    }
  });

  const handleZoom = (level) => {
    if (displayData.length === 0) return;

    setZoomLevel(level);

    if (level === 'all') {
      setBrushDomain(null);
      return;
    }

    const latestTime = displayData[displayData.length - 1][timeType];
    const hours = { '1h': 1, '6h': 6, '12h': 12, '24h': 24 }[level];
    const startTime = latestTime - (hours * 60 * 60 * 1000);

    const startIndex = displayData.findIndex((item) => item[timeType] >= startTime);
    const endIndex = displayData.length - 1;

    if (startIndex !== -1) {
      setBrushDomain({ startIndex, endIndex });
    }
  };

  // CHANGE 3: Helper function to check if zoom button should be disabled
  const isZoomDisabled = (hours) => {
    const requiredTimespan = hours * 60 * 60 * 1000;
    return dataTimespan < requiredTimespan;
  };

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.success.main,
    theme.palette.text.secondary,
  ];

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportChart']}>
      <ReportFilter handleSubmit={handleSubmit} showOnly>
        <div className={classes.filterItem}>
          <FormControl fullWidth>
            <InputLabel>{t('reportChartType')}</InputLabel>
            <Select
              label={t('reportChartType')}
              value={selectedTypes}
              onChange={(e) => setSelectedTypes(e.target.value)}
              multiple
              renderValue={(selected) => selected.join(', ')}
              disabled={!displayData.length}
            >
              {types.map((key) => (
                <MenuItem key={key} value={key}>{positionAttributes[key]?.name || key}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className={classes.filterItem}>
          <FormControl fullWidth>
            <InputLabel>{t('reportTimeType')}</InputLabel>
            <Select
              label={t('reportTimeType')}
              value={timeType}
              onChange={(e) => setTimeType(e.target.value)}
              disabled={!displayData.length}
            >
              <MenuItem value="fixTime">{t('positionFixTime')}</MenuItem>
              <MenuItem value="deviceTime">{t('positionDeviceTime')}</MenuItem>
              <MenuItem value="serverTime">{t('positionServerTime')}</MenuItem>
            </Select>
          </FormControl>
        </div>
      </ReportFilter>
      {displayData.length > 0 && (
        <Box sx={{ padding: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing
              {' '}
              {displayData.length}
              {' '}
              of
              {' '}
              {items.length}
              {' '}
              data points
            </Typography>
            <ButtonGroup size="small" variant="outlined">
              {/* CHANGE 3: Added disabled prop based on data timespan */}
              <Button
                onClick={() => handleZoom('1h')}
                variant={zoomLevel === '1h' ? 'contained' : 'outlined'}
                disabled={isZoomDisabled(1)}
              >
                1 Hour
              </Button>
              <Button
                onClick={() => handleZoom('6h')}
                variant={zoomLevel === '6h' ? 'contained' : 'outlined'}
                disabled={isZoomDisabled(6)}
              >
                6 Hours
              </Button>
              <Button
                onClick={() => handleZoom('12h')}
                variant={zoomLevel === '12h' ? 'contained' : 'outlined'}
                disabled={isZoomDisabled(12)}
              >
                12 Hours
              </Button>
              <Button
                onClick={() => handleZoom('24h')}
                variant={zoomLevel === '24h' ? 'contained' : 'outlined'}
                disabled={isZoomDisabled(24)}
              >
                24 Hours
              </Button>
              <Button
                onClick={() => handleZoom('all')}
                variant={zoomLevel === 'all' ? 'contained' : 'outlined'}
              >
                All
              </Button>
            </ButtonGroup>
          </Box>
          <div className={classes.chart} style={{ width: '100%', height: 530 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={displayData}
                margin={{
                  top: 10, right: 40, left: 0, bottom: 10,
                }}
              >
                <XAxis
                  stroke={theme.palette.text.primary}
                  dataKey={timeType}
                  type="number"
                  tickFormatter={(value) => formatTime(value, 'time')}
                  domain={['dataMin', 'dataMax']}
                  scale="time"
                  minTickGap={80}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis
                  stroke={theme.palette.text.primary}
                  type="number"
                  tickFormatter={(value) => value.toFixed(2)}
                  domain={[minValue - valueRange / 5, maxValue + valueRange / 5]}
                />
                <CartesianGrid stroke={theme.palette.divider} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}
                  formatter={(value, key) => [value, positionAttributes[key]?.name || key]}
                  labelFormatter={(value) => formatTime(value, 'seconds')}
                />
                <Brush
                  dataKey={timeType}
                  height={40}
                  stroke={theme.palette.primary.main}
                  fill={theme.palette.background.paper}
                  tickFormatter={(value) => formatTime(value, 'time')}
                  startIndex={brushDomain?.startIndex}
                  endIndex={brushDomain?.endIndex}
                  onChange={(domain) => {
                    if (domain) {
                      setBrushDomain(domain);
                      setZoomLevel('custom');
                    }
                  }}
                />
                {selectedTypes.map((type, index) => (
                  <Line
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stroke={colorPalette[index % colorPalette.length]}
                    dot={false}
                    activeDot={{ r: 6 }}
                    connectNulls
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            Use the slider below the chart to zoom into specific time ranges, or click preset buttons above
          </Typography>
        </Box>
      )}
    </PageLayout>
  );
};

export default ChartReportPage;
