import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Accounts, Requests, TransactionType } from '../accounts/accounts';
import { InputAreaComponent } from '../common/input-area/input-area.component';

@Component({
  selector: 'app-child',
  templateUrl: './child.component.html',
  styleUrls: ['./child.component.scss']
})
export class ChildComponent implements OnInit {

  constructor(public context:Context) { 

  }
  account:Accounts;

  async ngOnInit() {
    this.account = await this.context.for(Accounts).findFirst(acc => acc.familyMember.isEqualTo(this.context.user.id).and(acc.isPrimary.isEqualTo(true)));
  }
  async requestWithdrawal(){
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

}
