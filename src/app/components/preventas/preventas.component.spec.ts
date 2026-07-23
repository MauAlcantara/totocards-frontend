import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreventasComponent } from './preventas.component';

describe('PreventasComponent', () => {
  let component: PreventasComponent;
  let fixture: ComponentFixture<PreventasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreventasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreventasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
