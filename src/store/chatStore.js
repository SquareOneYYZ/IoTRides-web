import { createSlice } from '@reduxjs/toolkit';

const STORAGE_KEY = 'fleet_chat_messages';

const loadMessages = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw).map((m) => ({ ...m, ts: new Date(m.ts) }));
  } catch {
    console.warn('Failed to load chat messages from localStorage');
    return [];
  }
};

const saveMessages = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch {
    console.warn('Failed to save chat messages to localStorage');
  }
};

const { actions, reducer } = createSlice({
  name: 'chat',
  initialState: {
    messages: loadMessages(),
  },
  reducers: {
    addMessage(state, { payload }) {
      state.messages.push(payload);
      saveMessages(state.messages);
    },
    clearMessages(state) {
      state.messages = [];
      localStorage.removeItem(STORAGE_KEY);
    },
  },
});

export const chatActions = actions;
export default reducer;
