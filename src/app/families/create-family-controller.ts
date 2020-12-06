import { Context, ServerController, ServerFunction, ServerMethod, StringColumn } from '@remult/core';
import { ServerSignIn } from '../users/server-sign-in';
import { Users } from '../users/users';
import { Families, PasswordColumn } from './families';

@ServerController({
    key: 'createFamily',
    allowed: true

})
export class CreateFamilyController {
    familyName = new StringColumn("שם משפחה");
    parentName = new StringColumn("שם ההורה");
    childName = new StringColumn("שם הילד");
    email = new StringColumn('דוא"ל');
    password = new PasswordColumn();
    confirmPassword = new PasswordColumn('אשר סיסמה');

    constructor(private context: Context) {

    }
    @ServerMethod()
    async createAccount() {
        if (this.password.value != this.confirmPassword.value)
            throw Error('סיסמה אינה תואמת את אישור הסיסמה');
        let f = this.context.for(Families).create();
        f.name.value = this.familyName.value;
        await f.save();
        let p = f.createMember(this.parentName.value);
        p.isParent.value = true;
        p.name.value = this.parentName.value;
        p.email.value = this.email.value;
        p.password.value = Users.passwordHelper.generateHash(this.password.value);
        await p.save();
        let child = f.createMember(this.childName.value);
        child.name.value = this.childName.value;
        await child.save();

        return {
            family: ServerSignIn.helper.createSecuredTokenBasedOn(f.createFamilyUserInfo()),
            parent: ServerSignIn.helper.createSecuredTokenBasedOn(await p.createUserInfo())
        };
    }
}