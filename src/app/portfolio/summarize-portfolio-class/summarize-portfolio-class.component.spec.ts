import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SummarizePortfolioClassComponent } from './summarize-portfolio-class.component';
import { QuoteService } from '../../service/quote.service';
import { PortfolioService } from '../../service/portfolio-service';
import { SourceService } from '../../service/source.service';

class MyService {
  portfolios = () => ({})
  summarizeByClass = () => ({}) 
  currencyDefault = () => null
  enhanceExchangeInfo = () => ({})
}
describe('SummarizePortfolioClassComponent', () => {
  let component: SummarizePortfolioClassComponent;
  let fixture: ComponentFixture<SummarizePortfolioClassComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SummarizePortfolioClassComponent],
      providers: [
        {provide: QuoteService, useClass: MyService},
        {provide: SourceService, useClass: MyService},
        {provide: PortfolioService, useClass: MyService},
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SummarizePortfolioClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
