import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  activeServiceDomain: null, // Will include only originalId and title
  activeServiceType: null, // Will include only originalId and title
};

const serviceDomainSlice = createSlice({
  name: "serviceDomain",
  initialState,
  reducers: {
    setActiveServiceDomain: (state, action) => {
      state.activeServiceDomain = action.payload;
    },
    setActiveServiceType: (state, action) => {
      state.activeServiceType = action.payload;
    },
    clearSelection: (state) => {
      state.activeServiceDomain = null;
      state.activeServiceType = null;
    },
  },
});

export const { setActiveServiceDomain, setActiveServiceType, clearSelection } =
  serviceDomainSlice.actions;

  // Selectors
export const selectActiveServiceDomain = (state) => state.serviceDomainSelection.activeServiceDomain;
export const selectActiveServiceType = (state) => state.serviceDomainSelection.activeServiceType;

export default serviceDomainSlice.reducer;
