import { createSelector } from 'reselect';

export const getPositions = (state) => state.session.positions;
export const getDevices = (state) => state.devices.items;
export const getGroups = (state) => state.groups.items;
export const getPositionsArray = createSelector(
  [getPositions],
  (positions) => Object.values(positions),
);

export const getFilteredPositions = createSelector(
  [
    getPositionsArray,
    getDevices,
    getGroups,
    (state) => state.filter,
    (_, keyword) => keyword,
    (_, __, filterMap) => filterMap,
  ],
  (positions, devices, groups, filter, keyword, filterMap) => {
    const deviceGroups = (device) => {
      const groupIds = [];
      let { groupId } = device;
      while (groupId) {
        groupIds.push(groupId);
        groupId = groups[groupId]?.groupId || 0;
      }
      return groupIds;
    };

    const filtered = Object.values(devices)
      .filter((device) => !filter.statuses.length || filter.statuses.includes(device.status))
      .filter((device) => !filter.groups.length || deviceGroups(device).some((id) => filter.groups.includes(id)))
      .filter((device) => {
        const lowerCaseKeyword = keyword.toLowerCase();
        return [device.name, device.uniqueId, device.phone, device.model, device.contact, device.vin].some((s) => s && s.toLowerCase().includes(lowerCaseKeyword));
      });

    return filterMap
      ? filtered.map((device) => positions[device.id]).filter(Boolean)
      : positions;
  },
);
export const getFilteredDevices = createSelector(
  [
    getDevices,
    getGroups,
    (state) => state.filter,
    (_, keyword) => keyword,
    (_, __, filterSort) => filterSort,
  ],
  (devices, groups, filter, keyword, filterSort) => {
    const deviceGroups = (device) => {
      const groupIds = [];
      let { groupId } = device;
      while (groupId) {
        groupIds.push(groupId);
        groupId = groups[groupId]?.groupId || 0;
      }
      return groupIds;
    };

    const filtered = Object.values(devices)
      .filter((device) => !filter.statuses.length || filter.statuses.includes(device.status))
      .filter((device) => !filter.groups.length || deviceGroups(device).some((id) => filter.groups.includes(id)))
      .filter((device) => {
        const lowerCaseKeyword = keyword.toLowerCase();
        return [device.name, device.uniqueId, device.phone, device.model, device.contact, device.vin].some((s) => s && s.toLowerCase().includes(lowerCaseKeyword));
      });

    switch (filterSort) {
      case 'name':
        filtered.sort((device1, device2) => device1.name.localeCompare(device2.name));
        break;
      case 'lastUpdate':
        filtered.sort((device1, device2) => {
          const time1 = device1.lastUpdate ? new Date(device1.lastUpdate).getTime() : 0;
          const time2 = device2.lastUpdate ? new Date(device2.lastUpdate).getTime() : 0;
          return time2 - time1;
        });
        break;
      default:
        break;
    }

    return filtered;
  },
);
