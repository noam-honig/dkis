import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CtrlGComponent } from './ctrl-g.component';

describe('CtrlGComponent', () => {
  let component: CtrlGComponent;
  let fixture: ComponentFixture<CtrlGComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CtrlGComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CtrlGComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
