import { Component, OnInit } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';
import { Context, ServerFunction } from '@remult/core';
import { getInfo } from '../families/current-user-info';
import { FamilyMembers } from '../families/families';
import { Roles } from '../users/roles';
import { ServerSignIn } from '../users/server-sign-in';

@Component({
  selector: 'app-choose-family-member',
  templateUrl: './choose-family-member.component.html',
  styleUrls: ['./choose-family-member.component.scss']
})
export class ChooseFamilyMemberComponent implements OnInit {

  constructor(private context: Context, private authService: JwtSessionManager) { }
  members: FamilyMembers[] = [];
  async ngOnInit() {
    this.members = await this.context.for(FamilyMembers).find({ orderBy: o => [{ column: o.isParent, descending: true }, o.name] });
  }
  getFamilyName() {
    return getInfo(this.context).familyName;
  }
  async signInAsMember(m: FamilyMembers) {
    this.authService.setToken(await ChooseFamilyMemberComponent.memberSignIn(m.id.value));
  }
  @ServerFunction({ allowed: Roles.familyInfo })
  static async memberSignIn(memberId: string, context?: Context) {
    return ServerSignIn.helper.createSecuredTokenBasedOn(await (await context.for(FamilyMembers).findId(memberId)).createUserInfo());
  }
}
