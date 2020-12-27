import { Component, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Context } from '@remult/core';
import { InputAreaComponent } from '../common/input-area/input-area.component';
import { getInfo } from '../families/current-user-info';
import { Families, FamilyMembers } from '../families/families';
import { ServerEventsService } from '../server/server-events-service';

@Component({
  selector: 'app-parent-view',
  templateUrl: './parent-view.component.html',
  styleUrls: ['./parent-view.component.scss']
})
export class ParentViewComponent implements OnInit {

  constructor(public context: Context,private state:ServerEventsService) {

  }
  members: FamilyMembers[] = [];
  



  async ngOnInit() {
    this.loadMembers();
  }
  async loadMembers() {
    this.members = await this.context.for(FamilyMembers).find({ where: m => m.isParent.isEqualTo(false) });
  }
  tabChanged(tabChangeEvent: MatTabChangeEvent){
    let mem = this.members[tabChangeEvent.index];
    this.state.activeMember = mem.id.value;
  }

}
