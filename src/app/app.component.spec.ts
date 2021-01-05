import { TestBed, async } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { getAllowanceDates } from './families/families';

describe('AppComponent', () => {

  it("as", () => {
    expect(getAllowanceDates(undefined, 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2021-01-05'), 2, new Date('2021-01-05')).length).toBe(0);
    expect(getAllowanceDates(undefined, 3, new Date('2021-01-05')).length).toBe(0);
    expect(getAllowanceDates(new Date('2021-01-04'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2021-01-03'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2021-01-02'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2021-01-01'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2020-12-31'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2020-12-30'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2020-12-29'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([5]);
    expect(getAllowanceDates(new Date('2020-12-28'), 2, new Date('2021-01-05')).map(x => x.getDate())).toEqual([29, 5]);
    expect(getAllowanceDates(new Date('2021-01-04'), 1, new Date('2021-01-05')).length).toBe(0);
    expect(getAllowanceDates(new Date('2021-01-04'), 0, new Date('2021-01-05')).length).toBe(0);
    expect(getAllowanceDates(undefined, 2, new Date('2021-01-05T08:00:00')).map(x => x.getHours())).toEqual([8]);
    

  })
  //it("focus", () => {})


});


