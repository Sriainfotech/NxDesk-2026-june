import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  statusOptions: [
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'closed', label: 'Closed' },

  ],
  parentOptions: [
    { value: 'parent-1', label: 'Parent 1' },
    { value: 'parent-2', label: 'Parent 2' },
  ],
};

const optionsSlice = createSlice({
  name: 'options',
  initialState,
  reducers: {},
});

export default optionsSlice.reducer;
