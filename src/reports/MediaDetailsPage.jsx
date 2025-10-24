import React from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableRow, IconButton,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapGeofence from '../map/MapGeofence';
import MapScale from '../map/MapScale';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapRoutePath from '../map/MapRoutePath';
import ReportFilter from './components/ReportFilter';
import ColumnSelect from './components/ColumnSelect';

const MediaDetailsPage = () => {
  const classes = useReportStyles();

  const columns = [
    'startTime',
    'endTime',
    'distance',
    'averageSpeed',
    'maxSpeed',
    'duration',
  ];

  const fakeTrips = Array.from({ length: 5 }).map((_, i) => ({
    id: i + 1,
    startTime: '2025-10-20 10:00:00',
    endTime: '2025-10-20 12:00:00',
    distance: `${(Math.random() * 50).toFixed(1)} km`,
    averageSpeed: `${(40 + Math.random() * 20).toFixed(1)} km/h`,
    maxSpeed: `${(60 + Math.random() * 30).toFixed(1)} km/h`,
    duration: '2h 00m',
  }));

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>
      <div className={classes.container}>

        <div
          style={{
            backgroundColor: '#1e1e1e',
            borderRadius: '8px',
            aspectRatio: '16/9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            position: 'relative',
          }}
        >
          <PlayCircleOutlineIcon sx={{ fontSize: 100, color: '#555' }} />
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              color: '#aaa',
              fontSize: '14px',
            }}
          >
            Video Player Placeholder
          </div>
        </div>

        <div className={classes.containerMap}>
          <MapView>
            <MapGeofence />
            <MapRoutePath positions={[]} />
            <MapMarkers markers={[]} />
            <MapCamera positions={[]} />
          </MapView>
          <MapScale />
        </div>

        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter>
              <ColumnSelect columns={columns} setColumns={() => {}} columnsArray={[]} />
            </ReportFilter>
          </div>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={classes.columnAction} />
                {columns.map((col) => (
                  <TableCell key={col}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {fakeTrips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className={classes.columnAction} padding="none">
                    <IconButton size="small">
                      {Math.random() > 0.5 ? (
                        <GpsFixedIcon fontSize="small" />
                      ) : (
                        <LocationSearchingIcon fontSize="small" />
                      )}
                    </IconButton>
                  </TableCell>
                  {columns.map((col) => (
                    <TableCell key={col}>{trip[col]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </PageLayout>
  );
};

export default MediaDetailsPage;
