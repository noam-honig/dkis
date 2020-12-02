import { Component, Input, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Accounts, Requests, RequestStatus, Transactions, TransactionType } from '../accounts/accounts';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { FamilyMembers } from '../families/families';

@Component({
  selector: 'app-parent-child-view',
  templateUrl: './parent-child-view.component.html',
  styleUrls: ['./parent-child-view.component.scss']
})
export class ParentChildViewComponent implements OnInit {

  @Input() child: FamilyMembers;
  account: Accounts;
  transactions: Transactions[] = [];
  requests: Requests[] = [];
  constructor(private context: Context) { }

  async ngOnInit() {
    this.account = await this.context.for(Accounts).findFirst(acc => acc.familyMember.isEqualTo(this.child.id).and(acc.isPrimary.isEqualTo(true)));
    this.loadTransactions();
  }
  async loadTransactions() {
    
    await this.account.reload();
    this.transactions = await this.context.for(Transactions).find({ where: t => t.account.isEqualTo(this.account.id) });
    this.requests = await this.context.for(Requests).find({ where: t => t.account.isEqualTo(this.account.id).and(t.status.isEqualTo(RequestStatus.pending)) });
  }
  async deny(r: Requests) {
    await Requests.setStatus(r.id.value,false);
    this.loadTransactions();

  }
  
  async approve(r:Requests){
    await Requests.setStatus(r.id.value,true);
    this.loadTransactions();
    
  }
  async deposit() {
    let t = this.context.for(Transactions).create();
    t.account.value = this.account.id.value;
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
    t.account.value = this.account.id.value;
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
