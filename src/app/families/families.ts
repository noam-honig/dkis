import { async } from '@angular/core/testing';
import { BoolColumn, Context, DateTimeColumn, EntityClass, IdColumn, IdEntity, NumberColumn, StringColumn, UserInfo, ValueListColumn } from '@remult/core';
import { Accounts } from '../accounts/accounts';
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
            allowApiInsert: Roles.parent,
            defaultOrderBy: () =>
                [{ column: this.isParent, descending: true }, this.name],

            apiDataFilter: () => this.family.isEqualTo(getInfo(this.context).familyId),
            fixedWhereFilter: () => {
                if (this.context.isSignedIn())
                    return this.family.isEqualTo(getInfo(this.context).familyId);
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

export class FamilyColumn extends IdColumn {

    notifyChange() {
        setTimeout(() => {
            FamilyTools.SendMessageToBrowsersImplementation(this.value, "message");
        }, 1000);
    }
}

export const FamilyTools = {
    SendMessageToBrowsersImplementation: (familyId: string, message: string) => { }
}