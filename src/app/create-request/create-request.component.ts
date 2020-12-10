import { Component, OnInit } from '@angular/core';
import { Requests } from '../accounts/accounts';
import { MatDialogRef } from '@angular/material/dialog';
import { Context } from '@remult/core';

@Component({
  selector: 'app-create-request',
  templateUrl: './create-request.component.html',
  styleUrls: ['./create-request.component.scss']
})
export class CreateRequestComponent implements OnInit {

  constructor(private dialogRef: MatDialogRef<any>, public context:Context) { }

  ngOnInit() {
  }
  args: {
    request: Requests;
    ok: () => void;
  }

  send() {
    this.dialogRef.close();
    this.args.ok();
  }
}
