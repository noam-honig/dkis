import { Component, OnInit } from '@angular/core';
import { allEntities, Context } from '@remult/core';
import '../families/families';

@Component({
  selector: 'app-ctrl-g',
  templateUrl: './ctrl-g.component.html',
  styleUrls: ['./ctrl-g.component.scss']
})
export class CtrlGComponent implements OnInit {


  constructor(context: Context) {
    for (const entity of allEntities) {
      this.tables.push({
        settings: context.for(entity).gridSettings({
          allowCRUD: true
        })
      })
    }
  }
  tables: {
    settings
  }[] = [];

  ngOnInit() {
  }

}
