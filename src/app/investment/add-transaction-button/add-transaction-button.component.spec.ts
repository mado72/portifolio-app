import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTransactionButtonComponent } from './add-transaction-button.component';

describe('AddTransactionButtonComponent', () => {
  let component: AddTransactionButtonComponent;
  let fixture: ComponentFixture<AddTransactionButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTransactionButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTransactionButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
