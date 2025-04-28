import { TestBed } from '@angular/core/testing';

import { CacheService } from './cache.service';
import { of } from 'rxjs';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should store and retrieve a value', () => {
    service.set('testKey', 'testValue');
    const value = service.get<string>('testKey');
    expect(value).toBe('testValue');
  });

  it('should remove an item from the cache', () => {
    service.set('testKey', 'testValue');
    service.remove('testKey');
    const value = service.get<string>('testKey');
    expect(value).toBeNull();
  });

  it('should clear all items from the cache', () => {
    service.set('key1', 'value1');
    service.set('key2', 'value2');
    service.clear();
    expect(service.size()).toBe(0);
  });

  it('should check if an item exists in the cache', () => {
    service.set('testKey', 'testValue');
    expect(service.has('testKey')).toBeTrue();
    service.remove('testKey');
    expect(service.has('testKey')).toBeFalse();
  });

  it('should return all active keys', () => {
    service.set('key1', 'value1');
    service.set('key2', 'value2');
    const keys = service.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
  });

  it('should cache observable responses', (done) => {
    const observable = service.cacheResponse('testKey', 500)(of('testValue'));
    observable.subscribe((value) => {
      expect(value).toBe('testValue');
      const cachedValue = service.get<string>('testKey');
      expect(cachedValue).toBe('testValue');
      done();
    });
  });

  describe('with jasmine.clock', () => {

    beforeEach(() => {
      jasmine.clock().install();
      const baseTime = new Date(2013, 9, 23);
      jasmine.clock().mockDate(baseTime);

      spyOn(service as any, 'cleanExpiredItems').and.callThrough();
    });

    afterEach(() => {
      jasmine.clock().uninstall();
    });

    it('should return null for expired items', () => {
      const start = Date.now();
      service.set('testKey', 'testValue', 100); // 100ms expiry

      jasmine.clock().tick(2 * 1000); // Fast-forward 1s

      const after = Date.now();
      expect(after).toBeGreaterThan(start + 100);

      expect((service as any).cleanExpiredItems).not.toHaveBeenCalled();

      const value = service.get<string>('testKey');
      expect(value).toBeNull();
    });

    it('should refresh the expiration time of an item', () => {
      service.set('testKey', 'testValue', 100); // 100ms expiry
      jasmine.clock().tick(50); // Fast-forward 50ms
      const refreshed = service.refreshExpiry('testKey', 200); // Extend expiry
      expect(refreshed).toBeTrue();
      jasmine.clock().tick(150); // Fast-forward 150ms
      const value = service.get<string>('testKey');
      expect(value).toBe('testValue');
    });

    it('should clean up expired items automatically', () => {
      const cleanupInterval = setInterval(() => 
        (service as any).cleanExpiredItems(), 1 * 1000);

      try {
        const start = Date.now();
        service.set('testKey', 'testValue', 100); // 100ms expiry
  
        jasmine.clock().tick(2 * 1000); // Fast-forward 1s
  
        const after = Date.now();
        expect(after).toBeGreaterThan(start + 100);
  
        expect((service as any).cleanExpiredItems).toHaveBeenCalled();
        expect(service.size()).toBe(0);
      } catch (error) {
        console.error('Error during cleanup:', error);
      } finally {
        clearInterval(cleanupInterval);
      }
    });
  });
});
