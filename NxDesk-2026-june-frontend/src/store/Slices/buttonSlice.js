import { createSlice } from '@reduxjs/toolkit';

const buttonSlice = createSlice({
  name: 'button',
  initialState: {
    isDisabled: false,
  },
  reducers: {
    disableButton: (state) => {
      state.isDisabled = true;
    },
    enableButton: (state) => {
      state.isDisabled = false;
    },
  },
});

export const { disableButton, enableButton } = buttonSlice.actions;
export default buttonSlice.reducer;