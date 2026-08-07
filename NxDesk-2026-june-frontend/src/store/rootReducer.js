// src/redux/rootReducer.js
import { combineReducers } from "redux";
import profileReducer from "./reducers";

// Combine reducers
const rootReducer = combineReducers({
  profile: profileReducer, // This is where we store the user's profile
});

export default rootReducer;
