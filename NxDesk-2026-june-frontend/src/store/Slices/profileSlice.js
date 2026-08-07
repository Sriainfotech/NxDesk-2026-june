import { createSlice } from '@reduxjs/toolkit';

const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    username: 'User Name',
    profilePic: 'null' 
  },
  reducers: {
    setProfile: (state, action) => {
      state.username = action.payload.username;
      state.profilePic = action.payload.profilePic;
    }
  }
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;