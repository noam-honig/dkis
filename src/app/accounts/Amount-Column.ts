import { NumberColumn } from '@remult/core';

export class AmountColumn extends NumberColumn {
    constructor(caption: string = "סכום") {
        super({
            caption: caption,
            decimalDigits: 2
        })
    }
    get displayValue() {
        return "₪ " + this.value.toLocaleString();
    }
}