import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchTickets = createAsyncThunk('tickets/fetchTickets', async () => {
    const response = await fetch('/api/tickets');
    const data = await response.json();
    return data;
});

const ticketsSlice = createSlice({
    name: 'tickets',
    initialState: {
        tickets: [],
        status: 'idle',
        error: null,
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTickets.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTickets.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.tickets = action.payload;
            })
            .addCase(fetchTickets.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message;
            });
    },
});

export default ticketsSlice.reducer;
