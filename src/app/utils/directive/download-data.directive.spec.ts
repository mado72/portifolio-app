import { TestBed } from "@angular/core/testing";
import { DownloadDataDirective } from "./download-data.directive";

describe('DownloadDataDirective', () => {
  let directive: DownloadDataDirective;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      imports: [
        DownloadDataDirective
      ],
      providers: [
        { provide: DownloadDataDirective, useClass: DownloadDataDirective },
      ]
    })

    directive = TestBed.inject(DownloadDataDirective);
  })
  it('should create an instance', () => {
    expect(directive).toBeTruthy();
  });
});
