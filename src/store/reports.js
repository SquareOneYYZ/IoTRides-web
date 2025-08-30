import { createSlice } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

const { reducer, actions } = createSlice({
  name: 'reports',
  initialState: {
    groupIds: [],
    period: 'today',
    from: dayjs().subtract(1, 'hour').locale('en').format('YYYY-MM-DDTHH:mm'),
    to: dayjs().locale('en').format('YYYY-MM-DDTHH:mm'),
    eventIds: [],
  },
  reducers: {
    updateGroupIds(state, action) {
      state.groupIds = action.payload;
    },
    updatePeriod(state, action) {
      state.period = action.payload;
    },
    updateFrom(state, action) {
      state.from = action.payload;
    },
    updateTo(state, action) {
      state.to = action.payload;
    },
    updateEventIds(state, action) {
      state.eventIds = action.payload;
    },
    clearEventIds(state) {
      state.eventIds = [];
    },
  },
});

export { actions as reportsActions };
export { reducer as reportsReducer };
