import React, {
  useEffect, useRef, useState, useCallback,
} from 'react';
import { useDispatch } from 'react-redux';
import makeStyles from '@mui/styles/makeStyles';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { CircularProgress } from '@mui/material';
import { devicesActions } from '../store';
import { useEffectAsync } from '../reactHelper';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles((theme) => ({
  list: {
    maxHeight: '100%',
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(2),
  },
}));

const ITEMS_PER_PAGE = 30;

const DeviceList = ({ devices }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const listInnerEl = useRef(null);
  const listRef = useRef(null);

  const [displayedDevices, setDisplayedDevices] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allDevices, setAllDevices] = useState([]);

  if (listInnerEl.current) {
    listInnerEl.current.className = classes.listInner;
  }

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setTime(Date.now()), 60000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffectAsync(async () => {
    const response = await fetch('/api/devices');
    if (response.ok) {
      const data = await response.json();
      setAllDevices(data);
      dispatch(devicesActions.refresh(data));
      setDisplayedDevices(data.slice(0, ITEMS_PER_PAGE));
      setHasMore(data.length > ITEMS_PER_PAGE);
    } else {
      throw Error(await response.text());
    }
  }, []);

  useEffect(() => {
    if (devices && devices !== allDevices) {
      setDisplayedDevices(devices.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      setHasMore(devices.length > ITEMS_PER_PAGE);
      setAllDevices(devices);
    }
  }, [devices]);

  const loadMoreDevices = useCallback(() => {
    if (loading || !hasMore) return;

    setLoading(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = page * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newDevices = allDevices.slice(startIndex, endIndex);

      if (newDevices.length > 0) {
        setDisplayedDevices((prev) => [...prev, ...newDevices]);
        setPage(nextPage);
        setHasMore(endIndex < allDevices.length);
      } else {
        setHasMore(false);
      }

      setLoading(false);
    }, 100);
  }, [loading, hasMore, page, allDevices]);

  const handleScroll = useCallback(
    ({ scrollOffset, scrollUpdateWasRequested }) => {
      if (scrollUpdateWasRequested || loading || !hasMore) return;

      const listElement = listRef.current;
      if (!listElement) return;

      const scrollHeight = displayedDevices.length * 72;
      const clientHeight = listElement.props.height;
      const scrollPosition = scrollOffset + clientHeight;

      if (scrollHeight - scrollPosition < 200) {
        loadMoreDevices();
      }
    },
    [loading, hasMore, displayedDevices.length, loadMoreDevices],
  );

  return (
    <AutoSizer className={classes.list}>
      {({ height, width }) => (
        <FixedSizeList
          ref={listRef}
          width={width}
          height={height}
          itemCount={displayedDevices.length + (hasMore ? 1 : 0)}
          itemData={displayedDevices}
          itemSize={72}
          overscanCount={10}
          innerRef={listInnerEl}
          onScroll={handleScroll}
        >
          {({ index, style, data }) => {
            if (index === data.length) {
              return (
                <div style={style} className={classes.loadingContainer}>
                  <CircularProgress size={24} />
                </div>
              );
            }

            return <DeviceRow index={index} style={style} data={data} />;
          }}
        </FixedSizeList>
      )}
    </AutoSizer>
  );
};

export default DeviceList;
