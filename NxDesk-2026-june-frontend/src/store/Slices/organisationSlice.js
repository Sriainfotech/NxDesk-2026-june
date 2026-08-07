import { createSlice } from '@reduxjs/toolkit';

// Define the initial state
const initialState = {
  rootOrganisation: null,
  // You can add more organization-related state here
};

// Create the organization slice
export const organisationSlice = createSlice({
  name: 'organisation',
  initialState,
  reducers: {
    // Action to set the root organization
    setRootOrganisation: (state, action) => {
      state.rootOrganisation = action.payload;
    },
    // Action to clear the root organization
    clearRootOrganisation: (state) => {
      state.rootOrganisation = null;
    },
    // You can add more reducers for additional functionality
  },
});

// Export actions and reducer
export const { setRootOrganisation, clearRootOrganisation } = organisationSlice.actions;
export default organisationSlice.reducer;