// store/slices/userProfileSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { fetchUserDetails, createUserProfile, updateUserProfile } from "../actions/userActions";

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState: {
    user: null,
    status: "idle",
    error: null,
    profileCreated: false  // Flag to track if profile has been created
  },
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.profileCreated = false;
    },
    setProfileCreated: (state, action) => {
      state.profileCreated = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch user details
      .addCase(fetchUserDetails.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload;
        
        // Check if user has more fields than just the basic info
        // This indicates the profile has been created before
        const basicFields = ["username", "email", "organisation_name", "role"];
        const hasAdditionalInfo = Object.keys(action.payload).some(
          key => !basicFields.includes(key) && 
                action.payload[key] !== null && 
                action.payload[key] !== undefined &&
                key !== "id" &&
                key !== "created_at" &&
                key !== "modified_at"
        );
        
        state.profileCreated = hasAdditionalInfo;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // Create user profile
      .addCase(createUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(createUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = { ...state.user, ...action.payload };
        state.profileCreated = true;
      })
      .addCase(createUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      
      // Update user profile
      .addCase(updateUserProfile.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.status = "succeeded";
        // We don't need to update state.user here as fetchUserDetails will be called right after
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });
  },
});

export const { logoutUser, setProfileCreated } = userProfileSlice.actions;
export default userProfileSlice.reducer;