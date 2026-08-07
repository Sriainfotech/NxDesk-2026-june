import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage
import { combineReducers } from "redux";

// Import your reducers
import inputsReducer from "./reducers";
// import navReducer from '../features/nav/NavSlice';
import uiSlice from "./Slices/uiSlice";
// import filesReducer from '../features/nav/files/filesSlice';
// import optionsReducer from './Slices/selectOptionSlice';
import formReducer from "./Slices/formSlice";
import navbarReducer from "./navbarSlice";
import searchReducer from "./Slices/searchSlice";
import ticketsReducer from "./ticketSlice";
import authReducer from "../features/auth/authSlice";
import authenticationReducer from "./Slices/auth/authenticationSlice";
import buttonReducer from "./Slices/buttonSlice";
import forgotPasswordReducer from "./Slices/forgotpasswordSlice";
import itemsSlice from "./Slices/itemsSlice";
import ticketCreationSlice from "../features/auth/ticketCreationSlice";
import profileReducer from "./Slices/profileSlice";
import userProfileReducer from "./Slices/userProfileSlice"; // Is user Profile Created?
import organisationReducer from "./Slices/organisationSlice";
import serviceDomainReducer from "./Slices/serviceDomainSlice";

// Configure persistence for specific reducers
const persistConfig = {
  key: "root",
  storage,
  whitelist: [
    "profile",
    "auth",
    "authentication",
    "serviceDomainSelection",
    "organisation",
    "userProfile",
  ], // Add the reducers you want to persist here
};

// Combine all reducers
const rootReducer = combineReducers({
  inputs: inputsReducer,
  // navigation: navReducer,
  ui: uiSlice,
  // files: filesReducer,
  // options: optionsReducer,
  form: formReducer,
  navbar: navbarReducer,
  search: searchReducer,
  tickets: ticketsReducer,
  auth: authReducer,
  authentication: authenticationReducer,
  button: buttonReducer,
  forgotPassword: forgotPasswordReducer,
  items: itemsSlice,
  ticketCreation: ticketCreationSlice,
  profile: profileReducer,
  userProfile: userProfileReducer,
  serviceDomainSelection: serviceDomainReducer,
  organisation: organisationReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Create store with persisted reducer
const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

// Create persistor
export const persistor = persistStore(store);

export const clearPersistedState = () => {
  persistor.purge(); // This clears all persisted state
};

export default store;
