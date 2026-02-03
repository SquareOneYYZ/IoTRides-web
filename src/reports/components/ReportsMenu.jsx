import React from 'react';
import { Divider, List } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import CreateIcon from '@mui/icons-material/Create';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BarChartIcon from '@mui/icons-material/BarChart';
import RouteIcon from '@mui/icons-material/Route';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import NotesIcon from '@mui/icons-material/Notes';
import { useLocation } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useAdministrator, useRestriction } from '../../common/util/permissions';
import MenuItem from '../../common/components/MenuItem';

const ReportsMenu = ({ miniVariant = false }) => {
  const t = useTranslation();
  const location = useLocation();
  const admin = useAdministrator();
  const readonly = useRestriction('readonly');

  return (
    <>
      <List sx={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#171717' }}>
        <MenuItem
          title={t('reportCombined')}
          link="/reports/combined"
          icon={<StarIcon />}
          selected={location.pathname === '/reports/combined'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportEvents')}
          link="/reports/event"
          icon={<NotificationsActiveIcon />}
          selected={location.pathname === '/reports/event'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportGeofenceActivity')}
          link="/reports/geofence-activity"
          icon={<CreateIcon />}
          selected={location.pathname === '/reports/geofence-activity'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportTrips')}
          link="/reports/trip"
          icon={<PlayCircleFilledIcon />}
          selected={location.pathname === '/reports/trip'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportStops')}
          link="/reports/stop"
          icon={<PauseCircleFilledIcon />}
          selected={location.pathname === '/reports/stop'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportSummary')}
          link="/reports/summary"
          icon={<FormatListBulletedIcon />}
          selected={location.pathname === '/reports/summary'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportChart')}
          link="/reports/chart"
          icon={<TrendingUpIcon />}
          selected={location.pathname === '/reports/chart'}
          miniVariant={miniVariant}
        />
        <MenuItem
          title={t('reportReplay')}
          link="/replay"
          icon={<RouteIcon />}
          miniVariant={miniVariant}
        />
      </List>
      <Divider sx={{ borderColor: '#404244' }} />
      <List sx={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px', background: '#171717' }}>
        <MenuItem
          title={t('sharedLogs')}
          link="/reports/logs"
          icon={<NotesIcon />}
          selected={location.pathname === '/reports/logs'}
          miniVariant={miniVariant}
        />
        {!readonly && (
          <MenuItem
            title={t('reportScheduled')}
            link="/reports/scheduled"
            icon={<EventRepeatIcon />}
            selected={location.pathname === '/reports/scheduled'}
            miniVariant={miniVariant}
          />
        )}
        {admin && (
          <MenuItem
            title={t('statisticsTitle')}
            link="/reports/statistics"
            icon={<BarChartIcon />}
            selected={location.pathname === '/reports/statistics'}
            miniVariant={miniVariant}
          />
        )}
      </List>
    </>
  );
};

export default ReportsMenu;
