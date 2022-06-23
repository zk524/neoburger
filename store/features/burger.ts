import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// import type { RootState } from '../index';

interface BurgerState {
    address: string,
    network: string,
    quoteArr: string[],
    balance: {
        [asset: string]: string
    },
    walletName: string,
    temporarySwitch: number
}

interface BurgerUpdateState {
    address?: string,
    network?: string,
    quoteArr?: string[],
    balance?: {
        [asset: string]: string
    },
    walletName?: string,
    temporarySwitch?: number
}

const initialState: BurgerState = {
    address: '', // 钱包地址
    network: '',
    quoteArr: [],
    balance: {},
    walletName: '',
    temporarySwitch: 0
}

export const burgerSlice = createSlice({
    name: 'burger',
    initialState,
    reducers: {
        // 批量更新
        batchUpdate: (state, action: PayloadAction<BurgerUpdateState>) => {
            return state = {
                ...state,
                ...action.payload
            }
        },
        updateTemporarySwitch: (state) => {
            state.temporarySwitch += 1;
        }
    },
});

export const { batchUpdate, updateTemporarySwitch } = burgerSlice.actions;

// export const selectCount = (state: RootState) => state.counter.value;

export default burgerSlice.reducer;