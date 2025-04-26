import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MassiveImportComponent } from './massive-import.component';

describe('MassiveImportComponent', () => {
  let component: MassiveImportComponent;
  let fixture: ComponentFixture<MassiveImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MassiveImportComponent]
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
