import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InvestmentAssetTableFilterComponent } from './investment-asset-table-filter.component';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('InvestmentAssetTableFilterComponent', () => {
  let component: InvestmentAssetTableFilterComponent;
  let fixture: ComponentFixture<InvestmentAssetTableFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InvestmentAssetTableFilterComponent],
      imports: [FormsModule, MatInputModule, MatSelectModule],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvestmentAssetTableFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update filter values', () => {
    component.name = 'New Name';
    component.marketPlace = 'New Market';
    component.ticker = 'NEW';
    component.type = 'New Type';

    fixture.detectChanges();

    const nameInput = fixture.debugElement.query(By.css('input[name="name"]')).nativeElement;
    const marketPlaceSelect = fixture.debugElement.query(By.css('mat-select[name="marketPlace"]')).nativeElement;
    const tickerInput = fixture.debugElement.query(By.css('input[name="ticker"]')).nativeElement;
    const typeSelect = fixture.debugElement.query(By.css('mat-select[name="type"]')).nativeElement;

    expect(nameInput.value).toBe('New Name');
    expect(marketPlaceSelect.value).toBe('New Market');
    expect(tickerInput.value).toBe('NEW');
    expect(typeSelect.value).toBe('New Type');
  });
});