import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderComponent } from './header.component';
import { provideRouter } from '@angular/router';
import { MenuComponent } from '../menu/menu.component';
import { QuoteService } from '../../service/quote.service';

class MyService {
  exchanges = () => ({});
}

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent, MenuComponent],
      providers: [
        provideRouter([]),
        { provide: QuoteService, useClass: MyService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
