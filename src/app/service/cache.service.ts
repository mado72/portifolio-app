// src/app/services/cache.service.ts
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

@Injectable({
  providedIn: 'root'
})
/**
 * A service for managing a simple in-memory cache with expiration support.
 * Provides methods to store, retrieve, and manage cached items, including
 * support for RxJS observables and automatic cleanup of expired items.
 *
 * Features:
 * - Store and retrieve items with optional expiration times.
 * - Automatically removes expired items at regular intervals.
 * - Supports caching observable responses.
 * - Provides utility methods for cache management (e.g., size, keys, clear).
 *
 * Example usage:
 * ```typescript
 * const cacheService = new CacheService();
 * cacheService.set('key', 'value', 5000); // Store value with 5-second expiration
 * const value = cacheService.get<string>('key'); // Retrieve value
 * ```
 */
export class CacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private cleanupInterval: any;
  private readonly DEFAULT_EXPIRY_TIME_MS = 60 * 60 * 1000; // one hour by default
  private readonly DEFAULT_INTERVAL = 1 * 1000; // one second by default

  constructor() {
    // Start periodic cleanup every minute
    this.cleanupInterval = setInterval(() => this.cleanExpiredItems(), this.DEFAULT_INTERVAL);
  }

  /**
   * Stores a value in the cache with a specific key
   * @param key Unique key to identify the item in the cache
   * @param value Value to be stored
   * @param expiryTimeMs Time in milliseconds until expiration (optional)
   */
  set<T>(key: string, value: T, expiryTimeMs: number = this.DEFAULT_EXPIRY_TIME_MS): void {
    const expiresAt = Date.now() + expiryTimeMs;
    this.cache.set(key, { value, expiresAt });
    // console.debug(`[Cache] Item stored: ${key}, expires at ${new Date(expiresAt).toLocaleTimeString()}`);
  }

  /**
   * Retrieves a value from the cache by key
   * @param key Key of the item to be retrieved
   * @returns The stored value or null if it doesn't exist or has expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    // Check if the item exists and hasn't expired
    if (item && item.expiresAt > Date.now()) {
      console.debug(`[Cache] Cache hit: ${key}`);
      return item.value as T;
    }

    // If the item exists but has expired, remove it
    if (item) {
      console.debug(`[Cache] Item expired: ${key}`);
      this.remove(key);
    } else {
      console.debug(`[Cache] Cache miss: ${key}`);
    }

    return null;
  }

  /**
   * Retrieves a value from the cache as an Observable
   * @param key Key of the item to be retrieved
   * @returns Observable with the value or error if it doesn't exist
   */
  getAsObservable<T>(key: string): Observable<T> {
    const value = this.get<T>(key);
    return value !== null ? of(value) : throwError(() => new Error(`Item not found in cache: ${key}`));
  }

  /**
   * Checks if an item exists in the cache and is not expired
   * @param key Key of the item
   * @returns true if the item exists and is valid
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiresAt > Date.now();
  }

  /**
   * Removes a specific item from the cache
   * @param key Key of the item to be removed
   */
  remove(key: string): void {
    this.cache.delete(key);
    // console.debug(`[Cache] Item removed: ${key}`);
  }

  /**
   * Clears all items from the cache
   */
  clear(): void {
    this.cache.clear();
    // console.debug('[Cache] Cache completely cleared');
  }

  /**
   * Updates the expiration time of an item
   * @param key Key of the item
   * @param expiryTimeMs New time in milliseconds until expiration
   * @returns true if the item was updated, false if it doesn't exist
   */
  refreshExpiry(key: string, expiryTimeMs: number = this.DEFAULT_EXPIRY_TIME_MS): boolean {
    const item = this.cache.get(key);
    if (item) {
      item.expiresAt = Date.now() + expiryTimeMs;
      this.cache.set(key, item);
      // console.debug(`[Cache] Expiration updated: ${key}, new expiration: ${new Date(item.expiresAt).toLocaleTimeString()}`);
      return true;
    }
    return false;
  }

  /**
   * Gets the number of items in the cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Gets all active keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Method to use with RxJS operators to cache observable results
   * @param key Key to store the result
   * @param expiryTimeMs Expiration time in ms
   */
  cacheResponse<T>(key: string, expiryTimeMs: number = this.DEFAULT_EXPIRY_TIME_MS) {
    return (source: Observable<T>) => {
      return new Observable<T>(observer => {
        // Try to get from cache first
        const cachedValue = this.get<T>(key);
        if (cachedValue !== null) {
          observer.next(cachedValue);
          observer.complete();
          return;
        }

        // If not in cache, subscribe to the original observable
        return source.pipe(
          tap(response => {
            this.set(key, response, expiryTimeMs);
          })
        ).subscribe({
          next: value => observer.next(value),
          error: err => observer.error(err),
          complete: () => observer.complete()
        });
      });
    };
  }

  /**
   * Removes all expired items from the cache
   */
  private cleanExpiredItems(): void {
    const now = Date.now();
    let expiredCount = 0;

    this.cache.forEach((item, key) => {
      if (item.expiresAt <= now) {
        this.cache.delete(key);
        expiredCount++;
        console.log(`[Cache] Item expired and removed: ${key}`);
      }
    });

    // if (expiredCount > 0) {
    //   console.debug(`[Cache] Auto cleanup: ${expiredCount} expired items removed`);
    // }
  }

  /**
   * Method to clean up resources when the service is destroyed
   */
  ngOnDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}