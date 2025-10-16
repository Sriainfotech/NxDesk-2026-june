import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeLink: 'Your work',
};

const navbarSlice = createSlice({
  name: 'navbar',
  initialState,
  reducers: {
    setActiveLink(state, action) {
      state.activeLink = action.payload;
    },
  },
});

export const { setActiveLink } = navbarSlice.actions;
export default navbarSlice.reducer;


