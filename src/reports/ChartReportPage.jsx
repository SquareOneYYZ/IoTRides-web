import dayjs from 'dayjs';
import React, { useState, useMemo } from 'react';

import { ChevronLeft, ChevronRight , ZoomIn, ZoomOut } from 'lucide-react';

import {
  FormControl, InputLabel, Select, MenuItem, useTheme,
  Button
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

  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 100 });
  const [zoomLevel, setZoomLevel] = useState(1);

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
  const [type, setType] = useState('speed');
  const [timeType, setTimeType] = useState('fixTime');

  const values = items.map((it) => it[type]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;


  const visibleData = useMemo(() => {
		return items.slice(visibleRange.start, visibleRange.end);
  }, [visibleRange, items]);


  const handleScroll = (direction) => {
		const step = Math.floor(100 / zoomLevel);
		setVisibleRange((prev) => {
			if (direction === "left" && prev.start > 0) {
				return { start: Math.max(0, prev.start - step), end: Math.max(step, prev.end - step) };
			} else if (direction === "right" && prev.end < items.length) {
				return { start: Math.min(items.length - step, prev.start + step), end: Math.min(items.length, prev.end + step) };
			}
			return prev;
		});
  };

  const handleZoom = (zoomIn) => {
		setZoomLevel((prev) => {
			const newZoom = zoomIn ? prev * 2 : prev / 2;
			const clampedZoom = Math.min(Math.max(newZoom, 1), 8);
			const newRange = Math.floor(100 / clampedZoom);
			setVisibleRange((prev) => ({
				start: prev.start,
				end: Math.min(items.length, prev.start + newRange),
			}));
			return clampedZoom;
		});
  };

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
    } else {
      throw Error(await response.text());
    }
  });

  return (
		<PageLayout
			menu={<ReportsMenu />}
			breadcrumbs={["reportTitle", "reportChart"]}
		>
			<ReportFilter
				handleSubmit={handleSubmit}
				showOnly
			>
				<div className={classes.filterItem}>
					<FormControl fullWidth>
						<InputLabel>{t("reportChartType")}</InputLabel>
						<Select
							label={t("reportChartType")}
							value={type}
							onChange={(e) => setType(e.target.value)}
							disabled={!items.length}
						>
							{types.map((key) => (
								<MenuItem
									key={key}
									value={key}
								>
									{positionAttributes[key]?.name || key}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</div>
				<div className={classes.filterItem}>
					<FormControl fullWidth>
						<InputLabel>{t("reportTimeType")}</InputLabel>
						<Select
							label={t("reportTimeType")}
							value={timeType}
							onChange={(e) => setTimeType(e.target.value)}
							disabled={!items.length}
						>
							<MenuItem value="fixTime">{t("positionFixTime")}</MenuItem>
							<MenuItem value="deviceTime">{t("positionDeviceTime")}</MenuItem>
							<MenuItem value="serverTime">{t("positionServerTime")}</MenuItem>
						</Select>
					</FormControl>
				</div>
			</ReportFilter>
			<div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
				<Button
          style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
         
					onClick={() => handleScroll("left")}
					disabled={visibleRange.start === 0}
				>
					<ChevronLeft />
				</Button>
				<Button
					style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
					onClick={() => handleZoom(false)}
				>
					<ZoomOut />
				</Button>
				<Button
					style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
					onClick={() => handleZoom(true)}
				>
					<ZoomIn />
				</Button>
				<Button
					style={{ padding: "8px", cursor: "pointer", borderRadius: "4px" }}
					onClick={() => handleScroll("right")}
					disabled={visibleRange.end === items.length}
				>
					<ChevronRight />
				</Button>
			</div>

			{items.length > 0 && (
				<div className={classes.chart}>
					<ResponsiveContainer>
						<LineChart
							data={visibleData}
							margin={{
								top: 10,
								right: 40,
								left: 0,
								bottom: 10,
							}}
						>
							<XAxis
								stroke={theme.palette.text.primary}
								dataKey={timeType}
								type="number"
								tickFormatter={(value) => formatTime(value, "time")}
								domain={["dataMin", "dataMax"]}
								scale="time"
								minTickGap={40}
								height={40}
								interval={"preserveStartEnd"}
							/>
							<YAxis
								stroke={theme.palette.text.primary}
								type="number"
								tickFormatter={(value) => value.toFixed(2)}
								domain={[minValue - valueRange / 5, maxValue + valueRange / 5]}
							/>
							<CartesianGrid
								stroke={theme.palette.divider}
								strokeDasharray="3 3"
							/>
							<Tooltip
								contentStyle={{ backgroundColor: theme.palette.background.default, color: theme.palette.text.primary }}
								formatter={(value, key) => [value, positionAttributes[key]?.name || key]}
								labelFormatter={(value) => formatTime(value, "seconds")}
							/>
							<Brush
								dataKey={timeType}
								height={30}
								stroke={theme.palette.primary.main}
								tickFormatter={() => ""}
							/>
							<Line
								type="monotone"
								dataKey={type}
								stroke={theme.palette.primary.main}
								dot={false}
								activeDot={{ r: 6 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			)}
		</PageLayout>
  );
};

export default ChartReportPage;
