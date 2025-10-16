

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  issueStatus: '',
  issueParent: '',
};

const formSlice = createSlice({
  name: 'form',
  initialState,
  reducers: {
    setIssueStatus: (state, action) => {
      state.issueStatus = action.payload;
    },
    setIssueParent: (state, action) => {
      state.issueParent = action.payload;
    },
  },
});

export const { setIssueStatus, setIssueParent } = formSlice.actions;

export default formSlice.reducer;

