import { Context, ServerController, ServerMethod, StringColumn } from "@remult/core";
import { ServerSignIn } from '../users/server-sign-in';
import { Users } from '../users/users';
import { Families, FamilyMembers, PasswordColumn } from './families';

@ServerController({
    key: 'familySignIn',
    allowed: true
})
export class FamilySignInController {
    email = new StringColumn('דוא"ל', {
        dataControlSettings: () => ({
            inputType: 'email'
        })
    });
    password = new PasswordColumn();
    constructor(private context: Context) {

    }
    @ServerMethod()
    async signIn() {
        let parent = await this.context.for(FamilyMembers).findFirst(x => x.email.isContains(this.email).and(x.isParent.isEqualTo(true)));
        if (!parent || this.email.value.toLocaleLowerCase().trim() != parent.email.value.toLocaleLowerCase().trim())
            throw new Error("לא קיים");

        let f = await this.context.for(Families).findId(parent.family);
        if (parent.password.value && !Users.passwordHelper.verify(this.password.value, parent.password.value))
            throw new Error("סיסמה שגויה");
        return ServerSignIn.helper.createSecuredTokenBasedOn(f.createFamilyUserInfo());
    }

}

