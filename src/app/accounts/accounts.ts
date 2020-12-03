import { BoolColumn, Context, DateTimeColumn, EntityClass, IdColumn, IdEntity, NumberColumn, ServerFunction, StringColumn, ValueListColumn } from '@remult/core';
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
    request = new IdColumn();
    viewed = new BoolColumn();
    constructor(context: Context) {
        super({
            caption: 'תנועות',
            name: 'transactions',
            allowApiUpdate: false,
            allowApiDelete: false,
            allowApiInsert: Roles.parent,
            defaultOrderBy: () => [{ column: this.transactionTime, descending: true }],
            saving: async () => {
                if (context.onServer && this.isNew()) {
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
    @ServerFunction({ allowed: Roles.child })
    static async setViewed(transactionId: String, context?: Context) {
        let t = await context.for(Transactions).findId(transactionId);
        t.viewed.value = true;
        await t.save();
    }
}

export class TransactionType {
    static deposit = new TransactionType("הפקדה", (amount, acc) => acc.balance.value += amount);
    static withdrawal = new TransactionType("משיכה", (amount, acc) => acc.balance.value -= amount);

    constructor(public caption: string, public applyAmountToAccount: (amount: number, acc: Accounts) => number) {

    }
}


@EntityClass
export class Requests extends IdEntity {
    family = new IdColumn();
    familyMember = new IdColumn();
    account = new IdColumn();
    timestamp = new DateTimeColumn("מתי");
    type = new ValueListColumn(TransactionType);
    status = new ValueListColumn(RequestStatus, { defaultValue: RequestStatus.pending });
    description = new StringColumn('תאור');
    amount = new AmountColumn();

    constructor(context: Context) {
        super({
            caption: 'בקשות',
            name: 'requests',
            allowApiUpdate: false,
            allowApiDelete: false,
            allowApiInsert: true,

            defaultOrderBy: () => [{ column: this.timestamp, descending: true }],
            saving: async () => {
                if (context.onServer && this.isNew()) {
                    this.timestamp.value = new Date();
                    let acc = await context.for(Accounts).findId(this.account);
                    this.familyMember.value = acc.familyMember.value;
                    this.family.value = acc.family.value;
                }
            }
        })
    }
    @ServerFunction({ allowed: Roles.parent })
    static async setStatus(reqId: string, approve: boolean, context?: Context) {
        let r = await context.for(Requests).findId(reqId);
        if (r.status.value != RequestStatus.pending)
            throw new Error('לא ניתן לעדכן סטטוס לבקשה זו');
        r.status.value = approve ? RequestStatus.approved : RequestStatus.denied;
        if (r.status.value = RequestStatus.approved) {
            let t = context.for(Transactions).create();
            t.account.value = r.account.value;
            t.type.value = r.type.value;
            t.amount.value = r.amount.value;
            t.description.value = r.description.value;
            t.request.value = r.id.value;
            await t.save();
        }
        await r.save();
    }
}

export class RequestStatus {
    static pending = new RequestStatus('ממתין');
    static approved = new RequestStatus('אושר');
    static denied = new RequestStatus('נדחה');
    constructor(public caption: string) { }
}