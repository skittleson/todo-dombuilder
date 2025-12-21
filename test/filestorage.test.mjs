import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { Storage, FileStorage } from '../docs/storage.mjs';

describe('FileStorage Tests', () => {
  let mockLocalStorage;
  
  beforeEach(() => {
    // Clear any existing globals
    delete global.window;
    delete global.localStorage;
    
    // Mock localStorage (needed for Storage constructor)
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

    // Set up global window with electronAPI
    global.window = {
      electronAPI: {
        saveFile: async (data, defaultPath, storageKey) => {
          return { success: true, filePath: `/mock/path/${storageKey}.json` };
        },
        loadFile: async (storageKey) => {
          return { 
            success: true, 
            data: [],
            filePath: `/mock/path/${storageKey}.json`
          };
        }
      }
    };
    
    global.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
  });

  it('should detect Electron environment correctly', () => {
    const fileStorage = new FileStorage({ fileName: 'tasks.json', locationName: 'tasks' });
    expect(fileStorage._isElectron).to.be.true;
  });

  it('should use correct storage key', () => {
    const fileStorage = new FileStorage({ fileName: 'tasks.json', locationName: 'tasks' });
    expect(fileStorage._storageKey).to.equal('tasks');
  });

  it('should use default storage key when locationName not provided', () => {
    const fileStorage = new FileStorage({ fileName: 'tasks.json' });
    expect(fileStorage._storageKey).to.equal('tasks');
  });

  it('should work with FileStorage when useFileStorage is true', async () => {
    const storage = new Storage(mockLocalStorage, { useFileStorage: true, locationName: 'tasks' });
    
    expect(storage._storage).to.be.instanceOf(FileStorage);
    expect(storage._storage._isElectron).to.be.true;
    
    await storage.add('test1', { text: 'Test Task', completed: false });
    const tasks = await storage.list();
    
    expect(tasks).to.be.an('array');
    expect(tasks).to.deep.equal([]); // Mock returns empty array
  });
});