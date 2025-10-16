import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const recentItemsSlice = createSlice({
  name: 'recentItems',
  initialState,
  reducers: {
    setRecentItems: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { setRecentItems } = recentItemsSlice.actions;
export default recentItemsSlice.reducer;
