import { Context, ServerController, ServerMethod, StringColumn } from "@remult/core";
import { ServerSignIn } from '../users/server-sign-in';
import { Families, FamilyMembers } from './families';

@ServerController({
    key: 'familySignIn',
    allowed: true
})
export class FamilySignInController {
    email = new StringColumn('דוא"ל',{
        dataControlSettings:()=>({
            inputType:'email'
        })
    });
    constructor(private context: Context) {

    }
    @ServerMethod()
    async signIn() {
        let parent = await this.context.for(FamilyMembers).findFirst(x => x.email.isContains(this.email));
        if (!parent || this.email.value.toLocaleLowerCase().trim() != parent.email.value.toLocaleLowerCase().trim())
            throw new Error("לא קיים");
        let f = await this.context.for(Families).findId(parent.family);
        return ServerSignIn.helper.createSecuredTokenBasedOn(f.createFamilyUserInfo());
    }

}

