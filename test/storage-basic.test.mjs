import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { Storage, FileStorage } from '../docs/storage.mjs';

describe('Storage Functionality Tests', () => {
  let mockWindow;
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

  const setupElectronMock = () => {
    global.window = mockWindow = {
      electronAPI: {
        saveFile: async (data, defaultPath, storageKey) => {
          console.log('Mock saveFile called with:', { data, defaultPath, storageKey });
          return { success: true, filePath: `/mock/path/${storageKey}.json` };
        },
        loadFile: async (storageKey) => {
          console.log('Mock loadFile called with:', storageKey);
          return { 
            success: true, 
            data: [],
            filePath: `/mock/path/${storageKey}.json`
          };
        }
      }
    };
  };

  afterEach(() => {
    delete global.window;
    delete global.localStorage;
  });

  describe('Basic Storage Operations', () => {
    it('should work with localStorage when useFileStorage is false', async () => {
      // Create isolated test for localStorage
      const isolatedLocalStorage = {
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

      // Ensure no electronAPI
      const testWindow = {};
      global.window = testWindow;
      global.localStorage = isolatedLocalStorage;
      
      const storage = new Storage(isolatedLocalStorage, { useFileStorage: false, locationName: 'tasks' });
      
      await storage.add('test1', { text: 'Test Task', completed: false });
      const tasks = await storage.list();
      
      expect(tasks).to.be.an('array');
      expect(tasks.length).to.equal(1);
      expect(tasks[0].item.text).to.equal('Test Task');
    });

    it('should work with FileStorage when useFileStorage is true and electronAPI exists', async () => {
      setupElectronMock();
      
      const storage = new Storage(mockLocalStorage, { useFileStorage: true, locationName: 'tasks' });
      
      expect(storage._storage).to.be.instanceOf(FileStorage);
      expect(storage._storage._isElectron).to.be.true;
      
      await storage.add('test1', { text: 'Test Task', completed: false });
      const tasks = await storage.list();
      
      expect(tasks).to.be.an('array');
      expect(tasks).to.deep.equal([]); // Mock returns empty array
    });
  });

  describe('Electron Detection', () => {
    it('should detect Electron environment correctly', () => {
      setupElectronMock();
      const fileStorage = new FileStorage({ fileName: 'tasks.json', locationName: 'tasks' });
      expect(fileStorage._isElectron).to.be.true;
    });

    it('should detect non-Electron environment correctly', () => {
      // Don't set up electronAPI
      global.window = {};
      const fileStorage = new FileStorage({ fileName: 'tasks.json', locationName: 'tasks' });
      expect(fileStorage._isElectron).to.be.false;
    });
  });

  describe('Storage Key Handling', () => {
    it('should use tasks as default storage key', () => {
      setupElectronMock();
      const fileStorage = new FileStorage({ fileName: 'tasks.json' });
      expect(fileStorage._storageKey).to.equal('tasks');
    });

    it('should use custom locationName as storage key', () => {
      setupElectronMock();
      const fileStorage = new FileStorage({ fileName: 'notes.json', locationName: 'taskNotes' });
      expect(fileStorage._storageKey).to.equal('taskNotes');
    });
  });
});