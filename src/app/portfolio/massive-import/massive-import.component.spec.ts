import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MassiveImportComponent } from './massive-import.component';
import { BalanceService } from '../../service/balance.service';
import { MassiveService } from '../../service/massive.service';
import { signal } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('MassiveImportComponent', () => {
  let component: MassiveImportComponent;
  let fixture: ComponentFixture<MassiveImportComponent>;
  let balanceServiceMock: jasmine.SpyObj<BalanceService> = jasmine.createSpyObj('BalanceService', ['getAccounts']);
  let accounts = signal([]);
  let massiveServiceMock: jasmine.SpyObj<MassiveService> = jasmine.createSpyObj('MassiveService', ['parseJson', 'parseCsv']);

  beforeEach(async () => {
    accounts.set([]);
    balanceServiceMock.getAccounts.and.returnValue(accounts());

    await TestBed.configureTestingModule({
      imports: [MassiveImportComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: BalanceService, useFactory: () => balanceServiceMock },
        { provide: MassiveService, useFactory: () => massiveServiceMock },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MassiveImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
