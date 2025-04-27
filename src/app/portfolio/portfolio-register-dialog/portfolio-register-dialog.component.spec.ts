import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioRegisterDialogComponent } from './portfolio-register-dialog.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { Currency } from '../../model/domain.model';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideExchangeServiceMock } from '../../service/service-mock.spec';

class MyService {

}

const dataMock = {
  portfolio: {
    name: '',
    percPlanned: 0,
    currency: Currency.BRL
  }

}

const dialogMock = {
  close: () => {}
};

describe('PortfolioRegisterDialogComponent', () => {
  let component: PortfolioRegisterDialogComponent;
  let fixture: ComponentFixture<PortfolioRegisterDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioRegisterDialogComponent, 
        MatDialogModule, 
        ReactiveFormsModule,
      ],
      providers: [
        provideAnimationsAsync(),
        provideExchangeServiceMock(),
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortfolioRegisterDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
