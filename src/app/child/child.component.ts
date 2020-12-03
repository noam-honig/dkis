import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Accounts, Requests, RequestStatus, Transactions, TransactionType } from '../accounts/accounts';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';

@Component({
  selector: 'app-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.scss']
})
export class ChildComponent implements OnInit {

  constructor(public context: Context) {

  }
  account: Accounts;

  async ngOnInit() {
    this.account = await this.context.for(Accounts).findFirst(acc => acc.familyMember.isEqualTo(this.context.user.id).and(acc.isPrimary.isEqualTo(true)));
    this.loadTransactions();
  }
  transactions: Transactions[] = [];
  requests: Requests[] = [];



  async loadTransactions() {

    await this.account.reload();
    this.transactions = await this.context.for(Transactions).find({ where: t => t.account.isEqualTo(this.account.id) });


    for (const t of this.transactions.filter(t => !t.viewed.value).reverse()) {

      await this.context.openDialog(YesNoQuestionComponent, x => x.args = {
        message: t.type.value.caption + " - " + t.description.value + " " + t.amount.displayValue,
        isAQuestion: false

      });
      await Transactions.setViewed(t.id.value);

    }
    this.requests = await this.context.for(Requests).find({ where: t => t.account.isEqualTo(this.account.id).and(t.status.isEqualTo(RequestStatus.pending)) });
  }
  async requestWithdrawal() {
    let t = this.context.for(Requests).create();
    t.account.value = this.account.id.value;
    t.type.value = TransactionType.withdrawal;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'תיקנו לי משהו',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();
        await this.account.reload();
      }
    });

  }
  async requestDeposit() {
    let t = this.context.for(Requests).create();
    t.account.value = this.account.id.value;
    t.type.value = TransactionType.deposit;
    this.context.openDialog(InputAreaComponent, x => x.args = {
      title: 'קחו כסף לשמור לי',
      columnSettings: () => [t.amount, t.description],
      ok: async () => {
        await t.save();
        await this.account.reload();
      }
    });

  }
  

}
