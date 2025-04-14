import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExchangeButtonComponent } from './exchange-button.component';

describe('ExchangeButtonComponent', () => {
  let component: ExchangeButtonComponent;
  let fixture: ComponentFixture<ExchangeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExchangeButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExchangeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
