import { configureStore } from '@reduxjs/toolkit';
import burgerReducer from './features/burger';
import errorReducer from './features/error';


export const store = configureStore({
    reducer: {
        burger: burgerReducer,
        error: errorReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;