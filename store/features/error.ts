import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
    lastError: null as (Error | null), // 钱包地址
}

export const errorSlice = createSlice({
    name: 'error',
    initialState,
    reducers: {
        // 批量更新
        publishError: (state, action: PayloadAction<Error>) => {
            state.lastError = action.payload;
            return state;
        },
        clearError: (state, action: PayloadAction<Error>) => {
            if (state.lastError === action.payload) {
                state.lastError = null;
            }
            return state;
        }
    },
});

export const { publishError, clearError } = errorSlice.actions;

export default errorSlice.reducer;