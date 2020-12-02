import { Component, OnInit } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';
import { Context, getColumnsFromObject, ServerFunction } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { CreateFamilyController } from '../families/create-family-controller';
import { getInfo } from '../families/current-user-info';
import { Families } from '../families/families';
import { FamilySignInController } from '../families/family-sign-in-controller';
import { Roles } from '../users/roles';
import { ServerSignIn } from '../users/server-sign-in';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public context: Context, private authService: JwtSessionManager) {
    console.log(authService);
  }
  async register() {

    let createFamily = new CreateFamilyController(this.context);

    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'משפחה חדשה',
      columnSettings: () => getColumnsFromObject(createFamily),
      ok: async () => {
        let r = await createFamily.createAccount();
        this.authService.setToken(r, true);
      }
    });

  }
  signOut() {
    this.authService.signout();
  }
  async signIn() {
    let signIn = new FamilySignInController(this.context);
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      object: signIn,
      title: 'כניסת משפחה',
      ok: async () => {
        this.authService.setToken(await signIn.signIn());
      }
    })
  }
  async exitToFamily() {
    this.authService.setToken(await HomeComponent.getFamilyToken(), true);
  }
  @ServerFunction({ allowed: c => c.isSignedIn() })
  static async getFamilyToken(context?: Context) {
    let f = await context.for(Families).findId(getInfo(context).familyId);
    return ServerSignIn.helper.createSecuredTokenBasedOn(f.createFamilyUserInfo());
  }
  showChooseFamilyMember() {
    return this.context.isAllowed(Roles.familyInfo);
  }
  showParentView(){
    return this.context.isAllowed(Roles.parent);
  }
  showChildView(){
    return this.context.isAllowed(Roles.child);
  }

  ngOnInit() {
  }
}

