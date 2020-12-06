import { BoolColumn, Context, DateTimeColumn, EntityClass, IdColumn, IdEntity, NumberColumn, ServerFunction, SqlDatabase, StringColumn, ValueListColumn } from '@remult/core';
import { FamilyColumn } from '../families/families';
import { Roles } from '../users/roles';
import { AmountColumn } from './Amount-Column';
import * as moment from 'moment';
import { SelectValueDialogComponent } from '@remult/angular';
import { SqlBuilder } from '../common/sql-builder';

@EntityClass
export class Accounts extends IdEntity {

    family = new FamilyColumn();
    familyMember = new IdColumn();
    name = new StringColumn("שם");
    isPrimary = new BoolColumn("ראשי");
    balance = new AmountColumn("יתרה");
    target = new AmountColumn("סכום מטרה");
    constructor(private context: Context) {
        super({
            caption: 'חשבונות',
            name: 'accounts',
            allowApiInsert: true,
            saving: () => {
                this.family.notifyChange();
            }
        })
    }
    getTabTitle() {
        if (this.target.value > 0)
            return this.name.value + " " + (this.balance.value * 100 / this.target.value).toFixed(0) + "%";
        return this.name.value;
    }

}
@EntityClass
export class Transactions extends IdEntity {
    family = new FamilyColumn();
    familyMember = new IdColumn();
    account = new IdColumn();
    transactionTime = new DateTimeColumn("מתי");
    type = new ValueListColumn(TransactionType);
    description = new StringColumn('תאור',{
        dataControlSettings: () => ({
            click: async () => {
                let values = await Transactions.getTransferOptions(this.account.value, this.type.value == TransactionType.withdrawal);
                this.context.openDialog(SelectValueDialogComponent, x => x.args({
                    title: 'בחרו',
                    values: values.map(x => ({ caption: x })),
                    onSelect: selected => {
                        this.description.value = selected.caption
                    }
                }));
            }
        })
    });
    amount = new AmountColumn();
    balance = new AmountColumn();
    request = new IdColumn();
    counterAccount = new IdColumn();
    counterTransaction = new IdColumn();
    viewed = new BoolColumn();
    when() {
        return moment(this.transactionTime.value).locale('he').fromNow();
    }
    @ServerFunction({
        allowed: [Roles.parent, Roles.child]
    })
    static async getTransferOptions(accountId: string, withdrawal: boolean, context?: Context, db?: SqlDatabase) {
        let type = withdrawal ? TransactionType.withdrawal : TransactionType.deposit;
        let t = context.for(Transactions).create();
        let sql = new SqlBuilder();
        let r = await db.execute(sql.query({
            select: () => [sql.build('distinct ', t.description, ' as option')],
            from: t,
            where: () => [t.type.isEqualTo(type).and(t.account.isEqualTo(accountId))]
        }));
        let options = r.rows.map(x => x.option);
        if (options.length == 0) {
            if (type == TransactionType.withdrawal)
                options.push(['vbucks']);
            else {
                options.push(['דמי חנוכה', 'מתנה מסבא וסבתא']);
            }
        }

        return options.filter(x => x);


    }
    constructor(private context: Context) {
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
                this.family.notifyChange();
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
    static deposit = new TransactionType("הפקדה", 'black', (amount, acc) => acc.balance.value += amount);
    static withdrawal = new TransactionType("משיכה", 'red', (amount, acc) => acc.balance.value -= amount);
    static receiveFromAccount = new TransactionType("קבלה מחשבון", 'black', (amount, acc) => acc.balance.value += amount);
    static moveToAccount = new TransactionType("העברה לחשבון", 'green', (amount, acc) => acc.balance.value -= amount);

    constructor(public caption: string, public color: string, public applyAmountToAccount: (amount: number, acc: Accounts) => number) {

    }
}


@EntityClass
export class Requests extends IdEntity {
    family = new FamilyColumn();
    familyMember = new IdColumn();
    account = new IdColumn();
    timestamp = new DateTimeColumn("מתי");
    type = new ValueListColumn(TransactionType);
    status = new ValueListColumn(RequestStatus, { defaultValue: RequestStatus.pending });
    description = new StringColumn('תאור', {
        dataControlSettings: () => ({
            click: async () => {
                let values = await Transactions.getTransferOptions(this.account.value, this.type.value == TransactionType.withdrawal);
                this.context.openDialog(SelectValueDialogComponent, x => x.args({
                    title: 'בחרו',
                    values: values.map(x => ({ caption: x })),
                    onSelect: selected => {
                        this.description.value = selected.caption
                    }
                }));
            }
        })
    });
    amount = new AmountColumn();

    constructor(private context: Context) {
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
                this.family.notifyChange();
            }
        })
    }
    @ServerFunction({ allowed: Roles.parent })
    static async setStatus(reqId: string, approve: boolean, context?: Context) {
        let r = await context.for(Requests).findId(reqId);
        if (r.status.value != RequestStatus.pending)
            throw new Error('לא ניתן לעדכן סטטוס לבקשה זו');
        r.status.value = approve ? RequestStatus.approved : RequestStatus.denied;
        console.log(r.status.displayValue);
        if (r.status.value == RequestStatus.approved) {
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