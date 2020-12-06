import { Component, OnInit } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';
import { Context } from '@remult/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor(public sessionManager: JwtSessionManager, context: Context) {
    sessionManager.loadSessionFromCookie();
    if (!context.isSignedIn()) {
      let t = localStorage .getItem('token');
      if (t)
        sessionManager.setToken(t);
    }
  }

  ngOnInit() {
  }

}
