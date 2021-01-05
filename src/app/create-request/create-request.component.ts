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

  constructor(private dialogRef: MatDialogRef<any>, public context: Context) { }

  ngOnInit() {
  }
  args: {
    request: Requests;
    ok: () => void;
  }
  sendAlsoOnWhatsapp = true;
  send() {
    this.dialogRef.close();
    this.args.ok();
    if (this.sendAlsoOnWhatsapp) {
      let url = window.location.origin;
      let message = 'אשרו לי בבקשה ' + this.args.request.type.displayValue + ' של ' + this.args.request.amount.value+'₪';
      if (this.args.request.description.value)
        message += ' עבור ' + this.args.request.description.value;
      message += '.';
      message += '\nבאהבה ' + this.context.user.name;
      message += "\n" + url;

      window.open('https://wa.me/' + '?text=' + encodeURI(message), '_blank');
    }
  }
}
