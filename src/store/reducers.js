import { createSlice } from '@reduxjs/toolkit';

const inputsSlice = createSlice({
  name: 'inputs',
  initialState: {},
  reducers: {
    updateInput: (state, action) => {
      state[action.payload.name] = action.payload.value;
    },
  },
});

export const { updateInput } = inputsSlice.actions;
export default inputsSlice.reducer;