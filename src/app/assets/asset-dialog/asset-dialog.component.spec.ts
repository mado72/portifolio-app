import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AssetDialogComponent } from './asset-dialog.component';
import { RemoteQuotesService } from '../../service/remote-quotes.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

class MyService {

}

const dataMock = {
}

const dialogMock = {
  close: () => {}
};

describe('AssetDialogComponent', () => {
  let component: AssetDialogComponent;
  let fixture: ComponentFixture<AssetDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetDialogComponent],
      providers: [
        { provide: RemoteQuotesService, useValue: MyService },
        { provide: MatDialogRef, useValue: dialogMock },
        { provide: MAT_DIALOG_DATA, useValue: dataMock },
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssetDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
