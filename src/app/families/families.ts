import { async } from '@angular/core/testing';
import { BoolColumn, Context, DateTimeColumn, Entity, EntityClass, IdColumn, IdEntity, NumberColumn, ServerFunction, StringColumn, UserInfo, ValueListColumn } from '@remult/core';
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
            roles: [Roles.familyInfo],
            imageId:''

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
            imageId:this.imageId.value
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