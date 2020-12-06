import { Component, OnInit, ViewChild } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';
import { Context, getColumnsFromObject, ServerFunction } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { CreateFamilyController } from '../families/create-family-controller';
import { getInfo } from '../families/current-user-info';
import { Families, PasswordColumn } from '../families/families';
import { FamilySignInController } from '../families/family-sign-in-controller';
import { UpdatePasswordController } from '../families/update-password-controller';
import { ParentViewComponent } from '../parent-view/parent-view.component';
import { Roles } from '../users/roles';
import { ServerSignIn } from '../users/server-sign-in';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public context: Context, private authService: JwtSessionManager) {

  }
  async register() {

    let createFamily = new CreateFamilyController(this.context);

    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'משפחה חדשה',
      columnSettings: () => getColumnsFromObject(createFamily),
      ok: async () => {
        let r = await createFamily.createAccount();
        this.authService.setToken(r.parent, true);
        localStorage.setItem('token', r.family);
      }
    });

  }
  async updatePassword() {
    let c = new UpdatePasswordController(this.context);
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      object: c,
      title: 'עדכון סיסמה',
      ok: async () => {
        await c.updatePassword();
      }
    })
  }

  signOut() {
    this.authService.signout();
    localStorage.setItem('token', undefined);
  }
  async signIn() {
    let signIn = new FamilySignInController(this.context);
    await this.context.openDialog(InputAreaComponent, x => x.args = {
      object: signIn,
      helpText: 'אנא הקלידו את המייל של אחד ההורים והסיסמה',
      title: 'כניסת משפחה',
      ok: async () => {
        let token = await signIn.signIn();
        localStorage.setItem('token', token);
        this.authService.setToken(token);
      }
    })
  }
  async addMember() {
    let f = await this.context.for(Families).findId(getInfo(this.context).familyId);
    let member = f.createMember('');
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'הוסף בן משפחה',
      columnSettings: () => [member.name, member.isParent],
      ok: async () => {
        await member.save();
        this.parentView.loadMembers();
      }
    })
  }
  @ViewChild(ParentViewComponent, { static: false }) parentView;
  getTitle() {
    if (!this.context.isSignedIn())
      return '';
    if (this.showChooseFamilyMember())
      return 'משפחת ' + getInfo(this.context).familyName + ": ";
    return 'שלום ' + this.context.user.name;
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
  showParentView() {
    return this.context.isAllowed(Roles.parent);
  }
  showChildView() {
    return this.context.isAllowed(Roles.child);
  }



  ngOnInit() {
  }
}

