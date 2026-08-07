import { createSlice } from '@reduxjs/toolkit';

const forgotPasswordSlice = createSlice({
  name: 'forgotPassword',
  initialState: {
    emailSubmitted: false,
    otpVerified: false,
    loading: false,
    error: null,
  },
  reducers: {
    submitEmail: (state) => {
      state.loading = true;
      state.error = null;
    },
    submitEmailSuccess: (state) => {
      state.emailSubmitted = true;
      state.loading = false;
    },
    submitEmailFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    verifyOTP: (state) => {
      state.loading = true;
      state.error = null;
    },
    verifyOTPSuccess: (state) => {
      state.otpVerified = true;
      state.loading = false;
    },
    verifyOTPFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetPassword: (state) => {
      state.loading = true;
      state.error = null;
    },
    resetPasswordSuccess: (state) => {
      state.loading = false;
      state.emailSubmitted = false;
      state.otpVerified = false;
    },
    resetPasswordFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  submitEmail,
  submitEmailSuccess,
  submitEmailFailure,
  verifyOTP,
  verifyOTPSuccess,
  verifyOTPFailure,
  resetPassword,
  resetPasswordSuccess,
  resetPasswordFailure,
} = forgotPasswordSlice.actions;

export default forgotPasswordSlice.reducer;
