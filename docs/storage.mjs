export class FileStorage {
  constructor(options = { fileName: "tasks.json" }) {
    this._options = options;
    this._fileHandle = null;
    this._isElectron = typeof window !== 'undefined' && !!window.electronAPI;
    this._storageKey = options.locationName || "tasks";
  }

  async _ensureFileHandle() {
    if (this._isElectron) {
      return null; // Electron doesn't need persistent file handles
    }

    if (!this._fileHandle) {
      try {
        [this._fileHandle] = await window.showOpenFilePicker({
          types: [{
            description: 'JSON files',
            accept: { 'application/json': ['.json'] }
          }],
          multiple: false
        });
      } catch (e) {
        if (e.name === 'AbortError') {
          throw new Error('File selection cancelled');
        }
        throw new Error('Failed to open file: ' + e.message);
      }
    }
    return this._fileHandle;
  }

  async _readFile() {
    try {
      if (this._isElectron) {
        console.log(`📂 FILE READ: Attempting to load ${this._storageKey}`);
        const result = await window.electronAPI.loadFile(this._storageKey);
        console.log(`📂 FILE READ: Result for ${this._storageKey}:`, result);
        if (!result.success) {
          if (result.canceled) {
            return [];
          }
          throw new Error(result.error);
        }
        return result.data;
      }

      const fileHandle = await this._ensureFileHandle();
      const file = await fileHandle.getFile();
      const contents = await file.text();
      return JSON.parse(contents);
    } catch (e) {
      if (e.name === 'NotFoundError' || e instanceof SyntaxError) {
        return [];
      }
      throw e;
    }
  }

  async _writeFile(data) {
    if (this._isElectron) {
      const result = await window.electronAPI.saveFile(data, this._options.fileName, this._storageKey);
      if (!result.success && !result.canceled) {
        throw new Error(result.error);
      }
      return;
    }

    const fileHandle = await this._ensureFileHandle();
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
  }

  getItem() {
    return this._readFile();
  }

  async setItem(key, value) {
    const existingItems = await this._readFile();
    const filteredItems = existingItems.filter(item => item.key !== key);
    const parsedValue = JSON.parse(value);

    if (Array.isArray(parsedValue)) {
      const newItems = [...filteredItems, ...parsedValue];
      return this._writeFile(newItems);
    } else {
      const newItems = [...filteredItems, { key, item: parsedValue }];
      return this._writeFile(newItems);
    }
  }

  removeItem() {
    return this._writeFile([]);
  }
}

export class Storage {
  constructor(
    storage,
    options = {
      locationName: "tasks",
      useFileStorage: false,
    }
  ) {
    debugger;
    if (options.useFileStorage) {
      this._storage = new FileStorage(options);
    } else {
      this._storage = storage;
    }
    this._options = options;
  }
  async update(key, item) {
    let items = await this.remove(key);
    items.push({ key, item });
    await this._save(items);
  }
  async add(key, item) {
    let items = await this.list();
    items.push({ key, item });
    await this._save(items);
  }
  async list() {
    try {
      let items;
      // Check if storage is localStorage vs FileStorage
      if (this._storage === this._options || (this._storage.getItem && this._storage.setItem)) {
        // localStorage or similar synchronous storage
        const data = this._storage.getItem(this._options.locationName);
        if (data === null || data === undefined || data === "") {
          items = [];
        } else if (typeof data === 'string') {
          items = JSON.parse(data);
        } else {
          // Data is already an object/array, use it directly
          items = data;
        }
      } else {
        // FileStorage or similar asynchronous storage
        items = await this._storage.getItem();
      }

      if (items === null || items === undefined || !Array.isArray(items)) {
        items = [];
      }
      return items;
    } catch (e) {
      this.removeAll();
      return [];
    }
  }
  async get(key) {
    const items = await this.list();
    return items.find((item) => {
      return item.key == key;
    });
  }
  async removeAll() {
    await this._save([]);
  }
  async remove(key) {
    let items = await this.list();
    items = items.filter((data) => data.key != key);
    await this._save(items);
    return items;
  }
  async _save(items) {
    if (Array.isArray(items)) {
      if (this._storage.setItem) {
        this._storage.setItem(this._options.locationName, JSON.stringify(items));
      } else {
        await this._storage.setItem(this._options.locationName, JSON.stringify(items));
      }
    }
  }
}
