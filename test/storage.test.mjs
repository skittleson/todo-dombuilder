import assert from "assert";
import { Storage } from "../docs/storage.mjs";

describe("Storage", function () {
  let storage;
  let mockStorage;

  beforeEach(function () {
    mockStorage = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      }
    };
    storage = new Storage(mockStorage, { locationName: "tasks" });
  });

  describe("constructor", function () {
    it("should initialize without throwing", function () {
      assert.doesNotThrow(function () {
        new Storage(mockStorage, { locationName: "tasks" });
      });
    });

    it("should use default locationName if not provided", function () {
      const defaultStorage = new Storage(mockStorage);
      assert.equal(defaultStorage._options.locationName, "tasks");
    });
  });

  describe("add", function () {
    it("should add an item to storage", async function () {
      await storage.add("key1", "item1");
      const items = await storage.list();
      assert.equal(items.length, 1);
      assert.equal(items[0].key, "key1");
      assert.equal(items[0].item, "item1");
    });

    it("should add multiple items", async function () {
      await storage.add("key1", "item1");
      await storage.add("key2", "item2");
      const items = await storage.list();
      assert.equal(items.length, 2);
    });
  });

  describe("list", function () {
    it("should return empty array when no items exist", async function () {
      const items = await storage.list();
      assert.deepEqual(items, []);
    });

    it("should return items that were added", async function () {
      await storage.add("key1", "item1");
      await storage.add("key2", "item2");
      const items = await storage.list();
      assert.equal(items.length, 2);
      assert.equal(items[0].key, "key1");
      assert.equal(items[1].key, "key2");
    });

    it("should handle corrupted storage data", async function () {
      mockStorage.data.tasks = "invalid json";
      const items = await storage.list();
      assert.deepEqual(items, []);
    });

    it("should handle non-array storage data", async function () {
      mockStorage.data.tasks = JSON.stringify({ not: "array" });
      const items = await storage.list();
      assert.deepEqual(items, []);
    });
  });

  describe("get", function () {
    it("should return undefined for non-existent key", async function () {
      const item = await storage.get("nonexistent");
      assert.equal(item, undefined);
    });

    it("should return item for existing key", async function () {
      await storage.add("key1", "item1");
      const item = await storage.get("key1");
      assert.equal(item.item, "item1");
    });
  });

  describe("remove", function () {
    it("should remove an item by key", async function () {
      await storage.add("key1", "item1");
      await storage.add("key2", "item2");
      const remaining = await storage.remove("key1");
      assert.equal(remaining.length, 1);
      assert.equal(remaining[0].key, "key2");
      assert.equal(await storage.get("key1"), undefined);
      assert.equal((await storage.get("key2")).item, "item2");
    });

    it("should return empty array when removing last item", async function () {
      await storage.add("key1", "item1");
      const remaining = await storage.remove("key1");
      assert.deepEqual(remaining, []);
    });
  });

  describe("update", function () {
    it("should update an existing item", async function () {
      await storage.add("key1", "item1");
      await storage.update("key1", "updated1");
      const items = await storage.list();
      assert.equal(items.length, 1);
      assert.equal(items[0].item, "updated1");
    });

    it("should add new item if key doesn't exist", async function () {
      await storage.update("key1", "item1");
      const items = await storage.list();
      assert.equal(items.length, 1);
      assert.equal(items[0].key, "key1");
      assert.equal(items[0].item, "item1");
    });
  });

  describe("removeAll", function () {
    it("should remove all items", async function () {
      await storage.add("key1", "item1");
      await storage.add("key2", "item2");
      await storage.removeAll();
      const items = await storage.list();
      assert.deepEqual(items, []);
    });
  });

  describe("_save", function () {
    it("should save array to storage", async function () {
      const testItems = [{ key: "key1", item: "item1" }];
      await storage._save(testItems);
      const saved = JSON.parse(mockStorage.data.tasks);
      assert.deepEqual(saved, testItems);
    });

    it("should not save non-array items", async function () {
      await storage._save("not an array");
      assert.equal(mockStorage.data.tasks, undefined);
    });
  });
});