import { NumberColumn, NumberColumnOptions } from '@remult/core';
import { isString } from 'util';

export class AmountColumn extends NumberColumn {
    constructor(settingsOrCaption?: NumberColumnOptions) {
        if (!settingsOrCaption)
            settingsOrCaption = { caption: 'סכום' };
        if (isString(settingsOrCaption))
            settingsOrCaption = { caption: settingsOrCaption };
        settingsOrCaption.decimalDigits = 2;
        super(settingsOrCaption)
    }
    get displayValue() {
        return "₪ " + this.value.toLocaleString();
    }
} 