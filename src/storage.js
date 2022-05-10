export class Storage {
  constructor(
    storage,
    options = {
      listName: "tasks",
    }
  ) {
    this._storage = storage;
    this._options = options;
  }
  update(key, item) {
    let items = this.remove(key);
    items.push({ key, item });
    this._save(items);
  }
  add(key, item) {
    let items = this.list();
    items.push({ key, item });
    this._save(items);
  }
  list() {
    let items = JSON.parse(this._storage.getItem(this._options.listName));
    if (items == undefined || !Array.isArray(items)) {
      this.removeAll();
      items = [];
    }
    return items;
  }
  removeAll() {
    this._save([]);
  }
  remove(key) {
    let items = this.list();
    items = items.filter(data => data.key !== key);
    this._save(items);
    return items;
  }
  _save(items) {
    if (Array.isArray(items)) {
      this._storage.setItem(this._options.listName, JSON.stringify(items));
    }
  }
}