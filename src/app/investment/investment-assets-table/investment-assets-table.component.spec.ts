import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvestmentAssetsTableComponent } from './investment-assets-table.component';
import { AssetService } from '../../service/asset.service';
import { InvestmentService } from '../../service/investment.service';
import { PortfolioService } from '../../service/portfolio-service';

class MyService {
  assertsSignal = () => ({})
}
describe('InvestmentAssetsTableComponent', () => {
  let component: InvestmentAssetsTableComponent;
  let fixture: ComponentFixture<InvestmentAssetsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvestmentAssetsTableComponent],
      providers: [
        { provide: AssetService, useClass: MyService },
        { provide: InvestmentService, useClass: MyService },
        { provide: PortfolioService, useClass: MyService },
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvestmentAssetsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
