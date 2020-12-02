import { BoolColumn, Context, DateTimeColumn, EntityClass, IdColumn, IdEntity, NumberColumn, StringColumn, ValueListColumn } from '@remult/core';
import { Roles } from '../users/roles';
import { AmountColumn } from './Amount-Column';

@EntityClass
export class Accounts extends IdEntity {

    family = new IdColumn();
    familyMember = new IdColumn();
    name = new StringColumn("שם");
    isPrimary = new BoolColumn("ראשי");
    balance = new AmountColumn("יתרה");
    constructor(private context: Context) {
        super({
            caption: 'חשבונות',
            name: 'accounts'
        })
    }

}
@EntityClass
export class Transactions extends IdEntity {
    family = new IdColumn();
    familyMember = new IdColumn();
    account = new IdColumn();
    transactionTime = new DateTimeColumn("מתי");
    type = new ValueListColumn(TransactionType);
    description = new StringColumn('תאור');
    amount = new AmountColumn();
    balance = new AmountColumn();
    constructor(context: Context) {
        super({
            caption: 'תנועות',
            name: 'transactions',
            allowApiUpdate: false,
            allowApiDelete: false,
            allowApiInsert: Roles.parent,
            defaultOrderBy: () => [{ column: this.transactionTime, descending: true }],
            saving: async () => {
                if (context.onServer) {
                    this.transactionTime.value = new Date();
                    let acc = await context.for(Accounts).findId(this.account);
                    this.familyMember.value = acc.familyMember.value;
                    this.family.value = acc.family.value;
                    this.balance.value = this.type.value.applyAmountToAccount(this.amount.value, acc);
                    await acc.save();
                }
            }
        })
    }
}

export class TransactionType {
    static deposit = new TransactionType("הפקדה", (amount, acc) => acc.balance.value += amount);
    static withdrawal = new TransactionType("משיכה", (amount, acc) => acc.balance.value -= amount);

    constructor(public caption: string, public applyAmountToAccount: (amount: number, acc: Accounts) => number) {

    }
}

