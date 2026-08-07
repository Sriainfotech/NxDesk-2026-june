
import { createAction } from '@reduxjs/toolkit';
import { SET_PROFILE } from './actionTypes';


export const updateInput = createAction('inputs/updateInput');

export const setProfile = (username, profilePic) => {
    return {
      type: SET_PROFILE,
      payload: {
        username,
        profilePic
      }
    };
  };