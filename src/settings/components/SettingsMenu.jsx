import React from 'react';
import { Divider, List } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CreateIcon from '@mui/icons-material/Create';
import NotificationsIcon from '@mui/icons-material/Notifications';
import FolderIcon from '@mui/icons-material/Folder';
import PersonIcon from '@mui/icons-material/Person';
import StorageIcon from '@mui/icons-material/Storage';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import TodayIcon from '@mui/icons-material/Today';
import PublishIcon from '@mui/icons-material/Publish';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import HelpIcon from '@mui/icons-material/Help';
import CampaignIcon from '@mui/icons-material/Campaign';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import {
  useAdministrator,
  useManager,
  useRestriction,
} from '../../common/util/permissions';
import useFeatures from '../../common/util/useFeatures';
import MenuItem from '../../common/components/MenuItem';

const SettingsMenu = ({ miniVariant = false }) => {
  const t = useTranslation();
  const location = useLocation();

  const readonly = useRestriction('readonly');
  const admin = useAdministrator();
  const manager = useManager();
  const userId = useSelector((state) => state.session.user.id);
  const supportLink = useSelector(
    (state) => state.session.server.attributes.support,
  );

  const features = useFeatures();

  return (
    <>
      <List sx={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <MenuItem
          title={t('sharedPreferences')}
          link="/settings/preferences"
          icon={<SettingsIcon />}
          selected={location.pathname === '/settings/preferences'}
          miniVariant={miniVariant}
        />
        {!readonly && (
        <>
          <MenuItem
            title={t('sharedNotifications')}
            link="/settings/notifications"
            icon={<NotificationsIcon />}
            selected={location.pathname.startsWith('/settings/notification')}
            miniVariant={miniVariant}
          />
          <MenuItem
            title={t('settingsUser')}
            link={`/settings/user/${userId}`}
            icon={<PersonIcon />}
            selected={location.pathname === `/settings/user/${userId}`}
            miniVariant={miniVariant}
          />
          <MenuItem
            title={t('deviceTitle')}
            link="/settings/devices"
            icon={<SmartphoneIcon />}
            selected={location.pathname.startsWith('/settings/device')}
            miniVariant={miniVariant}
          />
          <MenuItem
            title={t('sharedGeofences')}
            link="/geofences"
            icon={<CreateIcon />}
            selected={location.pathname.startsWith('/settings/geofence')}
            miniVariant={miniVariant}
          />
          {!features.disableGroups && (
          <MenuItem
            title={t('settingsGroups')}
            link="/settings/groups"
            icon={<FolderIcon />}
            selected={location.pathname.startsWith('/settings/group')}
            miniVariant={miniVariant}
          />
          )}
          {admin && (
          <MenuItem
            title={t('settingsOrganization')}
            link="/settings/organizations"
            icon={<CorporateFareIcon />}
            selected={location.pathname.startsWith(
              '/settings/organization',
            )}
            miniVariant={miniVariant}
          />
          )}
          {!features.disableDrivers && (
          <MenuItem
            title={t('sharedDrivers')}
            link="/settings/drivers"
            icon={<PersonIcon />}
            selected={location.pathname.startsWith('/settings/driver')}
            miniVariant={miniVariant}
          />
          )}
          {!features.disableCalendars && (
          <MenuItem
            title={t('sharedCalendars')}
            link="/settings/calendars"
            icon={<TodayIcon />}
            selected={location.pathname.startsWith('/settings/calendar')}
            miniVariant={miniVariant}
          />
          )}
          {!features.disableComputedAttributes && (
          <MenuItem
            title={t('sharedComputedAttributes')}
            link="/settings/attributes"
            icon={<StorageIcon />}
            selected={location.pathname.startsWith('/settings/attribute')}
            miniVariant={miniVariant}
          />
          )}
          {!features.disableMaintenance && (
          <MenuItem
            title={t('sharedMaintenance')}
            link="/settings/maintenances"
            icon={<BuildIcon />}
            selected={location.pathname.startsWith('/settings/maintenance')}
            miniVariant={miniVariant}
          />
          )}
          {!features.disableSavedCommands && (
          <MenuItem
            title={t('sharedSavedCommands')}
            link="/settings/commands"
            icon={<PublishIcon />}
            selected={location.pathname.startsWith('/settings/command')}
            miniVariant={miniVariant}
          />
          )}
          {supportLink && (
          <MenuItem
            title={t('settingsSupport')}
            link={supportLink}
            icon={<HelpIcon />}
            miniVariant={miniVariant}
          />
          )}
        </>
        )}
      </List>

      {manager && (
        <>
          <Divider sx={{ borderColor: '#1f2937', margin: '8px 0' }} />
          <List sx={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <MenuItem
              title={t('serverAnnouncement')}
              link="/settings/announcement"
              icon={<CampaignIcon />}
              selected={location.pathname === '/settings/announcement'}
              miniVariant={miniVariant}
            />
            {admin && (
              <MenuItem
                title={t('settingsServer')}
                link="/settings/server"
                icon={<StorageIcon />}
                selected={location.pathname === '/settings/server'}
                miniVariant={miniVariant}
              />
            )}
            <MenuItem
              title={t('settingsUsers')}
              link="/settings/users"
              icon={<PeopleIcon />}
              selected={
                location.pathname.startsWith('/settings/user')
                && location.pathname !== `/settings/user/${userId}`
              }
              miniVariant={miniVariant}
            />
          </List>
        </>
      )}
    </>
  );
};

export default SettingsMenu;
