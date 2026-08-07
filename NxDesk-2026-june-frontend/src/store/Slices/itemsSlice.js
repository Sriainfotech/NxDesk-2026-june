import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
export const fetchItemData = createAsyncThunk('items/fetchItemData', async (apiUrl) => {
  const response = await axios.get(apiUrl);
  return response.data;
});

const itemsSlice = createSlice({
  name: 'items',
  initialState: {
    itemsData: {}, 
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchItemData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemData.fulfilled, (state, action) => {
        const apiUrl = action.meta.arg;
        state.itemsData[apiUrl] = action.payload; 
        state.loading = false;
      })
      .addCase(fetchItemData.rejected, (state, action) => {
        state.error = action.error.message;
        state.loading = false;
      });
  },
});

export default itemsSlice.reducer;