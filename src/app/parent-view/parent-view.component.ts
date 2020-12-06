import { Component, OnInit } from '@angular/core';
import { Context } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { getInfo } from '../families/current-user-info';
import { Families, FamilyMembers } from '../families/families';

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
    this.loadMembers();
  }
  async loadMembers() {
    this.members = await this.context.for(FamilyMembers).find({ where: m => m.isParent.isEqualTo(false) });
  }

}
