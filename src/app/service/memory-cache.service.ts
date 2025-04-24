import { Injectable } from '@angular/core';

interface CacheItem<T> {
  value: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryCacheService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private readonly DEFAULT_EXPIRY_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
  private cleanupInterval: any;
  private readonly STORAGE_KEY = 'app_cache';

  constructor() {
    this.loadFromStorage();

    // Start the process of cleaning up expired cache
    this.startCleanupProcess();
  }

  /**
   * Stores an item in the cache with an optional expiration time
   * @param key Key to identify the item
   * @param value Value to be stored
   * @param expiryTimeInMs Expiration time in milliseconds (optional, default: 1 hour)
   */
  set<T>(key: string, value: T, expiryTimeInMs?: number): void {
    const expiry = Date.now() + (expiryTimeInMs || this.DEFAULT_EXPIRY_TIME);
    this.cache.set(key, { value, expiry });

    this.saveToStorage();
  }

  /**
   * Retrieves an item from the cache if it is still valid
   * @param key Key of the item to be retrieved
   * @returns The stored value or null if it does not exist or has expired
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    // Check if the item exists and has not expired
    if (item && item.expiry > Date.now()) {
      return item.value as T;
    }
    
    // If the item has expired, remove it from the cache
    if (item) {
      this.remove(key);
    }
    
    return null;
  }

  /**
   * Removes a specific item from the cache
   * @param key Key of the item to be removed
   */
  remove(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clears the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Checks if a key exists in the cache and has not expired
   * @param key Key to be checked
   * @returns True if the key exists and has not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiry > Date.now();
  }

  /**
   * Starts the periodic cache cleanup process
   */
  private startCleanupProcess(): void {
    // Perform cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.removeExpiredItems();
    }, 60 * 1000);
  }

  /**
   * Removes all expired items from the cache
   */
  private removeExpiredItems(): void {
    const now = Date.now();
    
    this.cache.forEach((item, key) => {
      if (item.expiry <= now) {
        this.cache.delete(key);
      }
    });
  }

  private saveToStorage(): void {
    try {
      const cacheData: Record<string, CacheItem<any>> = {};
      
      this.cache.forEach((item, key) => {
        cacheData[key] = item;
      });
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Erro ao salvar cache no localStorage', e);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      
      if (data) {
        const cacheData = JSON.parse(data) as Record<string, CacheItem<any>>;
        
        Object.entries(cacheData).forEach(([key, item]) => {
          this.cache.set(key, item);
        });
        
        // Limpar itens expirados imediatamente após carregar
        this.removeExpiredItems();
      }
    } catch (e) {
      console.error('Erro ao carregar cache do localStorage', e);
    }
  }

  /**
   * Method to stop the cleanup process (useful when destroying the service)
   */
  ngOnDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}