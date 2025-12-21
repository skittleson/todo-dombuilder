import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { Storage, FileStorage } from '../docs/storage.mjs';

describe('LocalStorage Tests', () => {
  let mockLocalStorage;
  
  beforeEach(() => {
    // Clear any existing globals
    delete global.window;
    delete global.localStorage;
    
    // Mock localStorage
    mockLocalStorage = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      },
      removeItem: function(key) {
        delete this.data[key];
      }
    };

    global.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
  });

  it('should work with localStorage when useFileStorage is false', async () => {
    const storage = new Storage(mockLocalStorage, { useFileStorage: false, locationName: 'tasks' });
    
    await storage.add('test1', { text: 'Test Task', completed: false });
    const tasks = await storage.list();
    
    expect(tasks).to.be.an('array');
    expect(tasks.length).to.equal(1);
    expect(tasks[0].item.text).to.equal('Test Task');
  });
});