import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { FamilyMembers } from '../families/families';

@Component({
  selector: 'app-parent-view',
  templateUrl: './parent-view.component.html',
  styleUrls: ['./parent-view.component.scss']
})
export class ParentViewComponent implements OnInit {

  constructor(public context: Context) {

  }
  members: FamilyMembers[] = [];


  async ngOnInit() {
    this.members = await this.context.for(FamilyMembers).find({ where: m => m.isParent.isEqualTo(false) });
  }

}
