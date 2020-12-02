import { Component, OnInit } from '@angular/core';
import { JwtSessionManager } from '@remult/angular';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  constructor(public sessionManager: JwtSessionManager) {
    sessionManager.loadSessionFromCookie();
   }

  ngOnInit() {
  }

}
