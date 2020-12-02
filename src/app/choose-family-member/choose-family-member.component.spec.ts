import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseFamilyMemberComponent } from './choose-family-member.component';

describe('ChooseFamilyMemberComponent', () => {
  let component: ChooseFamilyMemberComponent;
  let fixture: ComponentFixture<ChooseFamilyMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseFamilyMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseFamilyMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
