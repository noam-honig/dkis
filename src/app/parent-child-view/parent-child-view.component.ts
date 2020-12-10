import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Context, ServerFunction, IdColumn } from '@remult/core';
import { Accounts, Requests, RequestStatus, Transactions, TransactionType } from '../accounts/accounts';
import { AmountColumn } from '../accounts/Amount-Column';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';
import { FamilyMembers } from '../families/families';
import { DestroyHelper, ServerEventsService } from '../server/server-events-service';
import { Roles } from '../users/roles';
import ConfettiGenerator from "confetti-js";
import { settings } from 'cluster';
@Component({
  selector: 'app-parent-child-view',
  templateUrl: './parent-child-view.component.html',
  styleUrls: ['./parent-child-view.component.scss']
})
export class ParentChildViewComponent implements OnInit, OnDestroy {

  @Input() childId: string;
  accounts: Accounts[];
  primaryAccount: Accounts;

  requests: Requests[] = [];
  constructor(private context: Context, public state: ServerEventsService) {
    state.onFamilyInfoChangedSubject(() => this.loadTransactions(), this.destroyHelper)
  }
  destroyHelper = new DestroyHelper();
  ngOnDestroy(): void {
    this.destroyHelper.destroy();
  }
  trackAccountBy(a: Accounts) {
    if (a.id)
      return a.id.value;
  }

  @ViewChild('confettiCanvas', { static: true }) canvas;
  confetti: ConfettiGenerator;
  async ngOnInit() {

    this.loadTransactions();
  }
  isChild() {

    return this.context.isAllowed(Roles.child);
  }
  isParent() {
    return this.context.isAllowed(Roles.parent);
  }
  loading = false;
  reload = false;
  async loadTransactions() {
    if (this.loading) {
      this.reload = true;
      return;
    }
    this.reload = false;
    this.loading = true;
    try {
      await this.context.for(Accounts).find({
        where: acc => acc.familyMember.isEqualTo(this.childId)
      }).then(accounts => {
        this.primaryAccount = accounts.splice(accounts.findIndex(a => a.isPrimary.value), 1)[0];
        this.accounts = accounts;
      });
      let promises: Promise<any>[] = [

        this.context.for(Requests).find({ where: t => t.familyMember.isEqualTo(this.childId).and(t.status.isEqualTo(RequestStatus.pending)) }).then(r => this.requests = r)

      ];
      if (this.context.isAllowed(Roles.child))
        promises.push(this.context.for(Transactions).find({ where: t => t.familyMember.isEqualTo(this.childId).and(t.viewed.isEqualTo(false)) }).then(async transactions => {
          let total = 0;
          for (const t of transactions) {
            total = t.type.value.delta(t.amount.value);
          }
          this.balance = this.primaryAccount.balance.value - total;


          for (const t of transactions.reverse()) {
            if (this.confetti)
              this.confetti.clear();
            this.confetti = new ConfettiGenerator({ target: this.canvas.nativeElement, respawn: false, max: 100, clock: 50, start_from_edge: true });
            this.confetti.render();


            await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
              message: t.type.value.caption + " - " + t.description.value + " " + t.amount.displayValue,
              isAQuestion: false

            });
            await Transactions.setViewed(t.id.value);
          }
        }));
      await Promise.all(promises);
      let delta = this.primaryAccount.balance.value - this.balance;
      this.balance = this.primaryAccount.balance.value;
      this.animateChange(delta);
    }
    finally {
      this.loading = false;
      if (this.reload)
        this.loadTransactions();
    }
  }
  displayBalance() {
    return (this.balance - this.balanceAnimationDelta).toLocaleString();
  }
  balance = 0;
  balanceAnimationDelta = 0;
  private animateChange(change: number) {
    this.balanceAnimationDelta = change;
    const steps = 50;
    let currentStep = 0;
    let interval = setInterval(() => {
      currentStep++;
      this.balanceAnimationDelta = Math.round(change * (steps - currentStep) / steps);
      if (currentStep == steps) {
        this.balanceAnimationDelta = 0;
        clearInterval(interval);
      }
    }, 15);
  }
  async addToSavings() {
    let amount = new AmountColumn("כמה להפקיד?");
    let targetAccountId = new IdColumn({
      dataControlSettings: () => ({
        valueList: () => this.context.for(Accounts).getValueList({ captionColumn: e => e.name, where: e => e.isPrimary.isEqualTo(false) }),
      })

    });
    let def = this.accounts.find(x => !x.isPrimary.value);
    if (def)
      targetAccountId.value = def.id.value;

    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'כמה להפקיד?',
      columnSettings: () => [amount, targetAccountId],
      ok: async () => {
        await ParentChildViewComponent.transferBetweenAccounts(this.primaryAccount.id.value, targetAccountId.value, amount.value);
        await this.loadTransactions();
        this.animateChange(-amount.value);
      }
    });
  }
  async withdrawFromSaving(account: Accounts) {
    let amount = new AmountColumn("כמה להעביר?");
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'כמה להעביר?',
      columnSettings: () => [amount],
      ok: async () => {
        await ParentChildViewComponent.transferBetweenAccounts(account.id.value, this.primaryAccount.id.value, amount.value);
      }
    });
  }
  async editAccount(account: Accounts) {
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'עדכון פרטי קופה',
      columnSettings: () => [account.name, account.target],
      ok: async () => {
        await account.save();
      },
      cancel: () => account.undoChanges(),
      buttons: [{
        text: 'בטל קופה', click: async () => {
          account.archive.value = true;
          await account.save();
          x.dialogRef.close();
          this.loadTransactions();

        }
      }]
    })

  }

  async addToSaving(account: Accounts) {
    let amount = new AmountColumn("כמה להפקיד?");
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'כמה להפקיד?',
      columnSettings: () => [amount],
      ok: async () => {
        await ParentChildViewComponent.transferBetweenAccounts(this.primaryAccount.id.value, account.id.value, amount.value);
      }
    });
  }
  @ServerFunction({ allowed: true })
  static async transferBetweenAccounts(sourceAccount: string, targetAccount: string, amount: number, context?: Context) {
    let source = context.for(Transactions).create();
    source.amount.value = amount;
    source.account.value = sourceAccount;
    source.counterAccount.value = targetAccount;
    source.type.value = TransactionType.moveToAccount;
    source.viewed.value = true;
    let target = context.for(Transactions).create();
    target.amount.value = amount;
    target.account.value = targetAccount;
    target.counterAccount.value = sourceAccount;
    target.type.value = TransactionType.receiveFromAccount;
    target.viewed.value = true;

    target.counterTransaction.value = source.id.value;
    source.counterTransaction.value = target.id.value;

    await Promise.all([source.save(), target.save()]);
  }
  async addAccount() {
    let mem = this.context.for(FamilyMembers).findId(this.childId);
    let acc = (await mem).createAccount();
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'קופת חסכון חדשה',
      columnSettings: () => [acc.name, acc.target],
      ok: async () => {
        await acc.save();
      }
    });
  }



  async deny(r: Requests) {
    await Requests.setStatus(r.id.value, false);
    this.loadTransactions();

  }
  showStatus(r: Requests) {
    return this.isChild() || r.status.value != RequestStatus.pending;
  }

  async approve(r: Requests) {
    await Requests.setStatus(r.id.value, true);
    this.loadTransactions();

  }
  async deposit() {
    let t = this.context.for(Transactions).create();
    t.account.value = this.primaryAccount.id.value;
    t.type.value = TransactionType.deposit;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'הפקדה לחשבון',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();

        await this.loadTransactions();
      }
    });
  }
  async withdrawal() {
    let t = this.context.for(Transactions).create();
    t.account.value = this.primaryAccount.id.value;
    t.type.value = TransactionType.withdrawal;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'משיכה',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();

        await this.loadTransactions();
      }
    });
  }


}
