import { Component, Input, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { Accounts, Transactions } from '../accounts/accounts';
import { YesNoQuestionComponent } from '../common/yes-no-question/yes-no-question.component';
import { DestroyHelper, ServerEventsService } from '../server/server-events-service';
import { Roles } from '../users/roles';
import { TransactionApprovedMessageComponent } from '../transaction-approved-message/transaction-approved-message.component';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {


  constructor(private context: Context, serverEvents: ServerEventsService) {
    serverEvents.onFamilyInfoChangedSubject(() => this.loadTransactions(), this.destroyHelper)
  }
  destroyHelper = new DestroyHelper();
  ngOnDestroy(): void {
    this.destroyHelper.destroy();
  }
  @Input() account: Accounts;
  


  async ngOnInit() {

    this.loadTransactions();
  }


  transactions: Transactions[] = [];

  loading = false;
  async loadTransactions() {
    if (this.loading)
      return;
    this.loading = true;
    try {
      await Promise.all([

        this.context.for(Transactions).find({ where: t => t.account.isEqualTo(this.account.id) }).then(t => this.transactions = t),

      ]);
      if (this.context.isAllowed(Roles.child))
        for (const t of this.transactions.filter(t => !t.viewed.value).reverse()) {

          await this.context.openDialog(TransactionApprovedMessageComponent, x => x.transaction = t);
          await Transactions.setViewed(t.id.value);
        }
    }
    finally {
      this.loading = false;
    }
  }
}
