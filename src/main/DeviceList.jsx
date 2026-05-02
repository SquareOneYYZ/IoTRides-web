import React, { useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles((theme) => ({
  list: {
    maxHeight: '100%',
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
}));

const DeviceList = ({ devices }) => {
  const classes = useStyles();
  const listInnerEl = useRef(null);

  useEffect(() => {
    if (listInnerEl.current) {
      listInnerEl.current.className = classes.listInner;
    }
  }, [classes.listInner]);

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AutoSizer className={classes.list}>
      {({ height, width }) => (
        <FixedSizeList
          width={width}
          height={height}
          itemCount={devices.length}
          itemData={devices}
          itemSize={72}
          overscanCount={10}
          innerRef={listInnerEl}
        >
          {DeviceRow}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};

export default DeviceList;