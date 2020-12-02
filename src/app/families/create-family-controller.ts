import { Context, ServerController, ServerFunction, ServerMethod, StringColumn } from '@remult/core';
import { ServerSignIn } from '../users/server-sign-in';
import { Families } from './families';

@ServerController({
    key: 'createFamily',
    allowed: true

})
export class CreateFamilyController {
    familyName = new StringColumn("שם משפחה");
    parentName = new StringColumn("שם ההורה");
    email = new StringColumn('דוא"ל');
    childName = new StringColumn("שם הילד");
    constructor(private context: Context) {

    }
    @ServerMethod()
    async createAccount() {
        let f = this.context.for(Families).create();
        f.name.value = this.familyName.value;
        await f.save();
        let p = f.createMember(this.parentName.value);
        p.isParent.value = true;
        p.name.value = this.parentName.value;
        p.email.value = this.email.value;
        await p.save();
        let child = f.createMember(this.childName.value);
        child.name.value = this.childName.value;
        await child.save();
        let account = child.createAccount();
        account.name.value = 'ראשי';
        account.isPrimary.value = true;
        await account.save();
        return ServerSignIn.helper.createSecuredTokenBasedOn(await p.createUserInfo());
    }
}