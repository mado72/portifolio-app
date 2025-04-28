import { TestBed } from '@angular/core/testing';

import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment.prod';
import { TreasuryBondResponse } from '../model/threasure.model';
import { CacheService } from './cache.service';
import { ThreasureService } from './threasure.service';

describe('ThreasureService', () => {
  let service: ThreasureService;
  let httpMock: HttpTestingController;
  let cacheServiceSpy: jasmine.SpyObj<CacheService> = jasmine.createSpyObj('CacheService', ['get', 'set']);
  let cacheService: jasmine.SpyObj<CacheService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CacheService, useFactory: () => cacheServiceSpy },
        ThreasureService,
      ]
    });

    service = TestBed.inject(ThreasureService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllBonds', () => {
    beforeEach(() => {
      cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;
    })

    it('should return cached response if available', () => {
      console.log('should return cached response if available');
      const mockResponse: TreasuryBondResponse = { /* mock data */ };
      cacheService.get.and.returnValue(mockResponse);

      service.getAllBonds().subscribe((response) => {
        expect(cacheService.get).toHaveBeenCalledWith(`${environment.apiBaseUrl}/bonds/all`);
        expect(response).toEqual(mockResponse);
        httpMock.expectNone(`${environment.apiBaseUrl}/bonds/all`);
      });
      
    });
    
    it('should fetch data from API and cache it if not in cache', () => {
      console.log('should fetch data from API and cache it if not in cache');
      const mockResponse: TreasuryBondResponse = { /* mock data */ };
      cacheService.get.and.callFake(() => {
        return null;
      });
      
      service.getAllBonds().subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });
      
      const req = httpMock.expectOne(`${environment.apiBaseUrl}/bonds/all`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
      
      expect(cacheService.set).toHaveBeenCalledWith(`${environment.apiBaseUrl}/bonds/all`, mockResponse);
    });
  });
  
  describe('getBondsById', () => {
    beforeEach(() => {
      cacheService = TestBed.inject(CacheService) as jasmine.SpyObj<CacheService>;
    })
    it('should return cached response if available', () => {
      console.log('should return cached response if available');
      const mockResponse: TreasuryBondResponse = { /* mock data */ };
      const ids = ['1', '2'];
      const cacheKey = `${environment.apiBaseUrl}/bonds/filter?bonds=1,2`;
      cacheService.get.and.returnValue(mockResponse);
      
      service.getBondsById(ids).subscribe((response) => {
        expect(cacheService.get).toHaveBeenCalledWith(cacheKey);
        expect(response).toEqual(mockResponse);
        httpMock.expectNone(`${environment.apiBaseUrl}/bonds/filter?bonds=1,2`);
      });
      
    });
    
    it('should fetch data from API and cache it if not in cache', () => {
      console.log('should fetch data from API and cache it if not in cache');
      const mockResponse: TreasuryBondResponse = { /* mock data */ };
      const ids = ['1', '2'];
      const cacheKey = `${environment.apiBaseUrl}/bonds/filter?bonds=1,2`;
      cacheService.get.and.returnValue(null);

      service.getBondsById(ids).subscribe((response) => {
        expect(response).toEqual(mockResponse);
        expect(cacheService.set).toHaveBeenCalledWith(cacheKey, mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/bonds/filter?bonds=1,2`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

    });
  })
});
