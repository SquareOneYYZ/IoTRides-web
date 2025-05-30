import React, { useState } from 'react';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
} from '@mui/material';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';

const GroupsPage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/organization');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  // const actionCommand = {
  //   key: 'command',
  //   title: t('deviceCommand'),
  //   icon: <PublishIcon fontSize='small' />,
  //   handler: (groupId) => navigate(`/settings/group/${groupId}/command`),
  // };

  // const actionConnections = {
  //   key: 'connections',
  //   title: t('sharedConnections'),
  //   icon: <LinkIcon fontSize='small' />,
  //   handler: (groupId) => navigate(`/settings/group/${groupId}/connections`),
  // };

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'settingsGroups']}
    >
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>{t('sharedName')}</TableCell>
            <TableCell className={classes.columnAction} />
          </TableRow>
        </TableHead>
        <TableBody>
          {!loading ? (
            items.filter(filterByKeyword(searchKeyword)).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell className={classes.columnAction} padding="none">
                  <CollectionActions
                    itemId={item.id}
                    editPath="/settings/organization"
                    endpoint="organization"
                    setTimestamp={setTimestamp}
                    // customActions={
                    //   limitCommands
                    //     ? [actionConnections]
                    //     : [actionConnections, actionCommand]
                    // }
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableShimmer columns={2} endAction />
          )}
        </TableBody>
      </Table>
      <CollectionFab editPath="/settings/organization" />
    </PageLayout>
  );
};

export default GroupsPage;
