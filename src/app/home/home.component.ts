import { Component, OnInit, ViewChild } from '@angular/core';
import { JwtSessionManager, SelectValueDialogComponent } from '@remult/angular';
import { Context, getColumnsFromObject, ServerFunction } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { CreateFamilyController } from '../families/create-family-controller';
import { getInfo } from '../families/current-user-info';
import { Families, FamilyMembers, PasswordColumn } from '../families/families';
import { FamilySignInController } from '../families/family-sign-in-controller';
import { UpdatePasswordController } from '../families/update-password-controller';
import { ParentViewComponent } from '../parent-view/parent-view.component';
import { Roles } from '../users/roles';
import { ServerSignIn } from '../users/server-sign-in';
import { ServerEventsService } from '../server/server-events-service';
import { Requests, Accounts, TransactionType } from '../accounts/accounts';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(public context: Context, private authService: JwtSessionManager, public state: ServerEventsService) {

  }
  ngOnInit(): void {
    
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
  async requestWithdrawal() {
    let t = this.context.for(Requests).create();
    let primaryAccount = await this.context.for(Accounts).findFirst(x => x.familyMember.isEqualTo(this.context.user.id).and(x.isPrimary.isEqualTo(true)));
    t.account.value = primaryAccount.id.value;
    t.type.value = TransactionType.withdrawal;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'תיקנו לי משהו',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();
        this.state.refreshState();
      }
    });

  }
  async requestDeposit() {
    let t = this.context.for(Requests).create();
    let primaryAccount = await this.context.for(Accounts).findFirst(x => x.familyMember.isEqualTo(this.context.user.id).and(x.isPrimary.isEqualTo(true)));
    t.account.value = primaryAccount.id.value;
    t.type.value = TransactionType.deposit;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'קחו כסף לשמור לי',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();
        this.state.refreshState();
      }
    });
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
  async removeMember() {
    let members = await this.context.for(FamilyMembers).find({ where: m => m.family.isEqualTo(getInfo(this.context).familyId) });
    this.context.openDialog(SelectValueDialogComponent, x => x.args({
      values: members.map(x => ({ caption: x.name.value, item: x })),
      title: 'איזה חשבון להסיר?',
      onSelect: async (m) => {
        m.item.archive.value = true;
        await m.item.save();
        this.parentView.loadMembers();
      }
    }));
  }
  async resetPassword() {
    let members = await this.context.for(FamilyMembers).find({ where: m => m.family.isEqualTo(getInfo(this.context).familyId) });
    this.context.openDialog(SelectValueDialogComponent, x => x.args({
      values: members.map(x => ({ caption: x.name.value, item: x })),
      title: 'למי לאתחל סיסמה?',
      onSelect: async (m) => {
        await HomeComponent.resetPassword(m.item.id.value);
      }
    }));
  }
  @ServerFunction({ allowed: Roles.parent })
  static async resetPassword(memberId: string, context?: Context) {
    let m = await context.for(FamilyMembers).findFirst(m => m.id.isEqualTo(memberId).and(m.family.isEqualTo(getInfo(context).familyId)));
    m.password.value = '';
    await m.save;

  }
  @ViewChild(ParentViewComponent, { static: false }) parentView;
  getTitle() {
    if (!this.context.isSignedIn())
      return '';
    if (this.showChooseFamilyMember())
      return 'משפחת ' + getInfo(this.context).familyName + ": ";
    return 'הי ' + this.context.user.name;
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


  
}

