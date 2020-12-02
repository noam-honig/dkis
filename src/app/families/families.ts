import { BoolColumn, Context, DateTimeColumn, EntityClass, IdColumn, IdEntity, NumberColumn, StringColumn, UserInfo, ValueListColumn } from '@remult/core';
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
            roles: [Roles.familyInfo]

        };
    }
}

@EntityClass
export class FamilyMembers extends IdEntity {


    family = new IdColumn();
    isParent = new BoolColumn("הורה מנהל?");
    name = new StringColumn("שם");
    email = new StringColumn('דוא"ל');
    password = new StringColumn();
    constructor(private context: Context) {
        super({
            caption: 'חברי משפחה',
            name: 'familyMembers',
            fixedWhereFilter: () => {
                return this.family.isEqualTo(getInfo(this.context).familyId);
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
            roles: [this.isParent.value ? Roles.parent : Roles.child]
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
export class Accounts extends IdEntity {
    family = new IdColumn();
    familyMember = new IdColumn();
    name = new StringColumn("שם");
    isPrimary = new BoolColumn("ראשי");
    balance = new NumberColumn("יתרה");
    constructor() {
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
    amount = new AmountColumn("סכום");
    balance = new NumberColumn();
    constructor() {
        super({
            caption: 'תנועות',
            name: 'transactions'
        })
    }
}

export class TransactionType {
    static deposit = new TransactionType("הפקדה");
    static withdrawal = new TransactionType("משיכה");

    constructor(public caption: string) {

    }
}


export class AmountColumn extends NumberColumn {
    constructor(caption: string = "יתרה") {
        super({
            caption: caption,
            decimalDigits: 2
        })
    }
}