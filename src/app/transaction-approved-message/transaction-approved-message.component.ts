import { Component, OnInit } from '@angular/core';
import { Transactions } from '../accounts/accounts';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-transaction-approved-message',
  templateUrl: './transaction-approved-message.component.html',
  styleUrls: ['./transaction-approved-message.component.scss']
})
export class TransactionApprovedMessageComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<any>) { 
  }

  ngOnInit() {
    this.dialogRef.addPanelClass("overlay");
    this.dialogRef.updateSize("100%", "100%");
  }

  transaction:Transactions;
}
