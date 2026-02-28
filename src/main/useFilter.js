import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getFilteredDevices, getFilteredPositions } from '../store/selectors';

export default (keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions) => {
  const filteredDevices = useSelector((state) => getFilteredDevices(
    { ...state, filter },
    keyword,
    filterSort,
  ));

  const filteredPositions = useSelector((state) => getFilteredPositions(
    { ...state, filter },
    keyword,
    filterMap,
  ));

  useEffect(() => {
    setFilteredDevices(filteredDevices);
    setFilteredPositions(filteredPositions);
  }, [filteredDevices, filteredPositions, setFilteredDevices, setFilteredPositions]);
};
