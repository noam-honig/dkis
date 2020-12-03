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
  

  async ngOnInit() {
    
  }
}
