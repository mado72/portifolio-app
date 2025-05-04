import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackTransactionButtonComponent } from './back-transaction-button.component';

describe('BackTransactionButtonComponent', () => {
  let component: BackTransactionButtonComponent;
  let fixture: ComponentFixture<BackTransactionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackTransactionButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BackTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
