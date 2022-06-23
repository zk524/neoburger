import BigNumber from 'bignumber.js';

interface FormatNumberOptions {
    decimals?: number;
    symbol?: string;
}

// 除以10的unit次方   1000 * 10^unit -> 1000
function integerToDecimal(integer: string, unit: number): string {
    if (new BigNumber(integer).isNaN()) {
        return '';
    }
    return new BigNumber(integer).shiftedBy(-unit).toFixed();
}

// eg: 1001.23 -> 1,001.23
function formatNumber(
    value: number | string | null | undefined,
    { decimals, symbol }: FormatNumberOptions = {},
): string {
    if (value == null) {
        return '-';
    }
    const bn = new BigNumber(value);
    if (bn.isNaN()) {
        return '-';
    }
    const options = {
        prefix: symbol ?? '',
        decimalSeparator: '.',
        groupSeparator: ',',
        groupSize: 3,
    };
    if (decimals !== undefined) {
        return bn.toFormat(decimals, BigNumber.ROUND_DOWN, options);
    } else {
        return bn.toFormat(options);
    }
}

export {
    integerToDecimal,
    formatNumber
}