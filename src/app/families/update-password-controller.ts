import { Context, ServerController, ServerMethod } from "@remult/core";
import { Roles } from '../users/roles';
import { Users } from '../users/users';
import { getInfo } from './current-user-info';
import { Families, FamilyMembers, PasswordColumn } from './families';

@ServerController({ key: 'updatePassword', allowed: [Roles.child, Roles.parent] })
export class UpdatePasswordController {
    password = new PasswordColumn();
    confirmPassword = new PasswordColumn('אישור סיסמה');
    constructor(private context: Context) {

    }
    @ServerMethod()
    async updatePassword() {
        if (this.password.value != this.confirmPassword.value)
            throw Error('סיסמה אינה תואמת את אישור הסיסמה');
        let m = await this.context.for(FamilyMembers).findId(this.context.user.id);
        m.password.value = Users.passwordHelper.generateHash(this.password.value);
        await m.save();
    }
 
}