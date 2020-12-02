import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentChildViewComponent } from './parent-child-view.component';

describe('ParentChildViewComponent', () => {
  let component: ParentChildViewComponent;
  let fixture: ComponentFixture<ParentChildViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ParentChildViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentChildViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
