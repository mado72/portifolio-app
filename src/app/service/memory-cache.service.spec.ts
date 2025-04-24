import { TestBed } from '@angular/core/testing';

import { MemoryCacheService } from './memory-cache.service';

describe('MemoryCacheService', () => {
  let service: MemoryCacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MemoryCacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve an item from the cache', () => {
    service.set('testKey', 'testValue');
    const value = service.get('testKey');
    expect(value).toBe('testValue');
  });

  it('should return null for expired items', (done) => {
    service.set('testKey', 'testValue', 100); // Set expiry to 100ms
    setTimeout(() => {
      const value = service.get('testKey');
      expect(value).toBeNull();
      done();
    }, 200);
  });

  it('should remove an item from the cache', () => {
    service.set('testKey', 'testValue');
    service.remove('testKey');
    const value = service.get('testKey');
    expect(value).toBeNull();
  });

  it('should clear all items from the cache', () => {
    service.set('key1', 'value1');
    service.set('key2', 'value2');
    service.clear();
    expect(service.get('key1')).toBeNull();
    expect(service.get('key2')).toBeNull();
  });

  it('should check if a key exists and is valid', () => {
    service.set('testKey', 'testValue');
    expect(service.has('testKey')).toBeTrue();
    service.remove('testKey');
    expect(service.has('testKey')).toBeFalse();
  });

  it('should remove expired items during cleanup', (done) => {
    service.set('testKey', 'testValue', 100); // Set expiry to 100ms
    setTimeout(() => {
      expect(service.has('testKey')).toBeFalse();
      done();
    }, 200);
  });

  it('should stop cleanup process on ngOnDestroy', () => {
    spyOn<any>(global, 'clearInterval');
    service.ngOnDestroy();
    expect(clearInterval).toHaveBeenCalled();
  });
});
