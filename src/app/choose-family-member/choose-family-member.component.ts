import { Component, OnInit } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';
import { BoolColumn, Context, ServerFunction } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { getInfo } from '../families/current-user-info';
import { FamilyMembers, PasswordColumn } from '../families/families';
import { Roles } from '../users/roles';
import { ServerSignIn } from '../users/server-sign-in';
import { Users } from '../users/users';

@Component({
  selector: 'app-choose-family-member',
  templateUrl: './choose-family-member.component.html',
  styleUrls: ['./choose-family-member.component.scss']
})
export class ChooseFamilyMemberComponent implements OnInit {

  constructor(private context: Context, private authService: JwtSessionManager) { }
  members: FamilyMembers[] = [];
  async ngOnInit() {
    this.members = await this.context.for(FamilyMembers).find();
  }
  getFamilyName() {
    return getInfo(this.context).familyName;
  }
  async signInAsMember(m: FamilyMembers) {
    let password = new PasswordColumn();
    let rememberMe = new BoolColumn('זכור אותי במכשיר זה');
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'סיסמה?',
      helpText: 'אם אתם לא מצליחים להכנס, בקשו מאחד ההורים לאתחל לכם סיסמה. אם גם הם לא מצליחים צרו אתנו קשר ונעזור',
      columnSettings: () => [password, rememberMe],
      ok: async () => {
        this.authService.setToken(await ChooseFamilyMemberComponent.memberSignIn(m.id.value, password.value), rememberMe.value);
      }
    })

  }
  @ServerFunction({ allowed: Roles.familyInfo })
  static async memberSignIn(memberId: string, password: string, context?: Context) {
    let m = await context.for(FamilyMembers).findId(memberId);
    if (m.password.value && !Users.passwordHelper.verify(password, m.password.value))
      throw Error("סיסמה שגויה");
    return ServerSignIn.helper.createSecuredTokenBasedOn(await m.createUserInfo());
  }
}
 