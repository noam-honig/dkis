import { async } from '@angular/core/testing';
import { BoolColumn, Context, DateColumn, DateTimeColumn, Entity, EntityClass, IdColumn, IdEntity, NumberColumn, ServerFunction, StringColumn, UserInfo, ValueListColumn } from '@remult/core';
import { Accounts, Transactions, TransactionType } from '../accounts/accounts';
import { AmountColumn } from '../accounts/Amount-Column';
import { Roles } from '../users/roles';
import { CurrentUserInfo, getInfo } from './current-user-info';

@EntityClass
export class Families extends IdEntity {
    name = new StringColumn("שם");
    createDate = new DateTimeColumn();

    constructor(private context: Context) {
        super({
            caption: 'משפחות',
            name: 'families'
        })
    }
    createMember(name: string) {
        let m = this.context.for(FamilyMembers).create();
        m.family.value = this.id.value;
        m.name.value = name;
        return m;
    }
    createFamilyUserInfo(): CurrentUserInfo {
        return {
            familyId: this.id.value,
            familyName: this.name.value,
            id: '',
            name: '',
            roles: [Roles.familyInfo],
            imageId: ''

        };
    }
}

@EntityClass
export class FamilyMembers extends IdEntity {


    family = new IdColumn();
    isParent = new BoolColumn("הורה מנהל?");
    name = new StringColumn("שם");
    email = new StringColumn('דוא"ל');
    password = new PasswordColumn();
    archive = new BoolColumn();
    imageId = new IdColumn();
    autoAllowance = new BoolColumn('דמי כיס קבועים');
    allowanceAmount = new AmountColumn('סכום דמי כיס');
    allowanceDayOfWeek = new ValueListColumn(DayOfWeek, { caption: 'יום בשבוע לדמי כיס' });


    lastAllowanceDate = new DateColumn({ allowApiUpdate: false });
    @ServerFunction({ allowed: c => c.isSignedIn() })
    static async verifyAllowance(id: string, context?: Context) {
        let mem = await context.for(FamilyMembers).findId(id);
        let account: Accounts;
        if (mem.autoAllowance.value && mem.allowanceAmount.value) {
            for (const d of getAllowanceDates(mem.lastAllowanceDate.value, mem.allowanceDayOfWeek.value.id, new Date())) {
                if (!account) {
                    account = await context.for(Accounts).findFirst(x => x.familyMember.isEqualTo(id).and(x.isPrimary.isEqualTo(true)));
                }
                let t = context.for(Transactions).create();
                t.account.value = account.id.value;
                t.type.value = TransactionType.deposit;
                t.amount.value = mem.allowanceAmount.value;
                t.description.value = 'דמי כיס';
                t.transactionTime.value = d;
                t._forceDate = true;
                await t.save();
                mem.lastAllowanceDate.value = d;

            }
            if (account)
                await mem.save();
        }

    }


    constructor(private context: Context) {
        super({
            caption: 'חברי משפחה',
            name: 'familyMembers',
            allowApiInsert: Roles.parent,
            defaultOrderBy: () =>
                [{ column: this.isParent, descending: true }, this.name],
            allowApiUpdate: Roles.parent,

            apiDataFilter: () => this.family.isEqualTo(getInfo(this.context).familyId),
            fixedWhereFilter: () => {
                if (this.context.isSignedIn())
                    return this.family.isEqualTo(getInfo(this.context).familyId).and(this.archive.isEqualTo(false));
            },
            saving: async () => {
                if (this.isNew() && context.onServer) {
                    if (!this.isParent.value) {
                        let account = this.createAccount();
                        account.name.value = 'ראשי';
                        account.isPrimary.value = true;
                        await account.save();
                    }

                }
                if (this.allowanceAmount.value != this.allowanceAmount.originalValue ||
                    this.autoAllowance.value && !this.autoAllowance.originalValue) {
                    let d = new Date();
                    d.setDate(d.getDate() - 1);// last day so if today is the allowance day, we want them to receive it.
                    this.lastAllowanceDate.value = d;
                }
            }

        })
    }
    async createUserInfo(): Promise<CurrentUserInfo> {
        let f = await this.context.for(Families).findId(this.family);
        return {
            familyId: this.family.value,
            familyName: f.name.value,
            id: this.id.value,
            name: this.name.value,
            roles: [this.isParent.value ? Roles.parent : Roles.child],
            imageId: this.imageId.value
        };
    }
    createAccount() {
        let r = this.context.for(Accounts).create();
        r.family.value = this.family.value;
        r.familyMember.value = this.id.value;
        return r;

    }
}
@EntityClass
export class FamilyMemberBackground extends IdEntity {
    familyMember = new IdColumn();
    backgroundStorage = new StringColumn();
    constructor() {
        super('FamilyMemberBackground');
    }
    @ServerFunction({ allowed: x => x.isAllowed([Roles.child, Roles.parent]) })
    static async uploadImage(id: string, image: string, context?: Context) {
        let mem = await context.for(FamilyMembers).findId(id);
        for (let x of await context.for(FamilyMemberBackground).find({ where: x => x.familyMember.isEqualTo(id) })) {
            await x.delete();
        }
        let x = context.for(FamilyMemberBackground).create();
        x.familyMember.value = id;
        x.backgroundStorage.value = image;
        await x.save();
        mem.imageId.value = x.id.value;
        await mem.save();


    }
}

export class FamilyColumn extends IdColumn {

    notifyChange() {
        setTimeout(() => {
            FamilyTools.SendMessageToBrowsersImplementation(this.value, "message");
        }, 100);
    }
}

export const FamilyTools = {
    SendMessageToBrowsersImplementation: (familyId: string, message: string) => { }
}
export class PasswordColumn extends StringColumn {
    constructor(caption = 'סיסמה') {
        super({
            caption,
            dataControlSettings: () => ({ inputType: 'password' }),
            includeInApi: false
        })
    }
}


export function getAllowanceDates(lastDate: Date, dayOfWeek: number, currentDate?: Date) {
    if (!currentDate)
        currentDate = new Date();
    let origDate = new Date(currentDate);
    currentDate = new Date(new Date().toDateString())
    let time = origDate.valueOf() - currentDate.valueOf();

    if (!lastDate) {
        lastDate = new Date(currentDate.toDateString());
        lastDate.setDate(lastDate.getDate() - 1);
    }
    else
        lastDate = new Date(lastDate.toDateString());
    let d = new Date(lastDate);
    let result = [];
    d.setDate(d.getDate() - d.getDay() + dayOfWeek);
    if (d <= lastDate)
        d.setDate(d.getDate() + 7);
    while (d <= currentDate) {
        result.push(new Date(new Date(d.toDateString()).valueOf() + time));
        d.setDate(d.getDate() + 7);
    }
    return result;
}
class DayOfWeek {
    static sunday = new DayOfWeek(0, 'ראשון');
    static monday = new DayOfWeek(1, 'שני');
    static tuesday = new DayOfWeek(2, 'שלישי');
    static wednesday = new DayOfWeek(3, 'רביעי');
    static thursday = new DayOfWeek(4, 'חמישי');
    static friday = new DayOfWeek(5, 'שישי');
    static saturday = new DayOfWeek(6, 'שבת');

    constructor(public id: number, public caption: string) {

    }

}