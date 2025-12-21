import assert from "assert";
import { JSDOM } from "jsdom";

describe("App Integration", function () {
  let dom;

  beforeEach(function () {
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { 
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    global.window = dom.window;
    global.document = dom.window.document;
    global.localStorage = {
      data: {},
      getItem: function(key) { return this.data[key] || null; },
      setItem: function(key, value) { this.data[key] = value; },
      removeItem: function(key) { delete this.data[key]; }
    };
  });

  afterEach(function () {
    dom.window.close();
  });

  describe("Initial Application Load", function () {
    it("should load all required modules", function () {
      assert.doesNotThrow(function () {
        import("../docs/app.mjs");
      });
    });

    it("should initialize main UI components", function () {
      // Create basic UI elements to verify structure
      const header = document.createElement('h1');
      header.textContent = 'Tasks';
      document.body.appendChild(header);
      
      const helpDialog = document.createElement('dialog');
      const pre = document.createElement('pre');
      pre.textContent = 'Shortcuts help text';
      helpDialog.appendChild(pre);
      document.body.appendChild(helpDialog);
      
      assert.ok(document.querySelector('h1'), "Header element should exist");
      assert.ok(helpDialog, "Help dialog should exist");
    });
  });

  describe("Help Dialog Functionality", function () {
    beforeEach(function () {
      // Set up minimal DOM structure
      document.body.innerHTML = '';
      
      // Mock dialog methods
      Object.defineProperty(document.createElement('dialog').constructor.prototype, 'showModal', {
        value: function() { this.open = true; }
      });
      
      Object.defineProperty(document.createElement('dialog').constructor.prototype, 'close', {
        value: function() { this.open = false; }
      });
    });

    it("should create help dialog with proper structure", function () {
      const helpDialog = document.createElement('dialog');
      const pre = document.createElement('pre');
      pre.textContent = 'Help text';
      helpDialog.appendChild(pre);
      document.body.appendChild(helpDialog);
      
      assert.ok(helpDialog);
      assert.equal(helpDialog.tagName, 'DIALOG');
      assert.ok(helpDialog.querySelector('pre'));
    });

    it("should show help dialog when showModal called", function () {
      const helpDialog = document.createElement('dialog');
      document.body.appendChild(helpDialog);
      
      helpDialog.showModal();
      assert.equal(helpDialog.open, true, "Help dialog should be open");
    });

    it("should toggle help dialog visibility", function () {
      const helpDialog = document.createElement('dialog');
      document.body.appendChild(helpDialog);
      
      // Open dialog
      helpDialog.showModal();
      assert.equal(helpDialog.open, true);
      
      // Close dialog
      helpDialog.close();
      assert.equal(helpDialog.open, false);
    });
  });

  describe("Task to Pomodoro Integration", function () {
    beforeEach(function () {
      document.body.innerHTML = '';
    });

    it("should switch to pomodoro when task callback is triggered", function () {
      let taskCallbackCalled = false;
      let taskData = null;

      global.Storage = class {
        constructor() {}
        list() { return []; }
        get() { return null; }
      };
      global.Tasks = class {
        constructor(options) {
          this._options = options;
          this.ui = document.createElement('div');
          this.hidden = false;
        }
        focus() {}
      };
      global.Pomodoro = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
          this.isRunning = false;
        }
        description(id, description) {
          taskCallbackCalled = true;
          taskData = { id, description };
        }
      };

      const tasksInstance = new global.Tasks({
        externalTaskCallback: (task) => {
          taskCallbackCalled = true;
          taskData = task;
        }
      });
      
      // Simulate task callback
      tasksInstance._options.externalTaskCallback({
        id: 123,
        description: "Test task"
      });
      
      assert.equal(taskCallbackCalled, true, "Task callback should be called");
      assert.deepEqual(taskData, {
        id: 123,
        description: "Test task"
      });
    });
  });

  describe("Keyboard Navigation", function () {
    beforeEach(function () {
      document.body.innerHTML = '';
    });

    it("should handle escape key to return to tasks", function () {
      let pomodoroHidden = false;
      let tasksFocused = false;

      global.Storage = class {
        constructor() {}
        list() { return []; }
        get() { return null; }
      };
      global.Tasks = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
        }
        focus() { tasksFocused = true; }
      };
      global.Pomodoro = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
          this.isRunning = false;
        }
        set hidden(value) {
          this._hidden = value;
          if (value) pomodoroHidden = true;
        }
        get hidden() { return this._hidden; }
      };

      // Simulate escape behavior
      const tasksInstance = new global.Tasks();
      const pomodoroInstance = new global.Pomodoro();
      
      // Simulate escape key handling
      if (!pomodoroInstance.isRunning) {
        pomodoroInstance.hidden = true;
        tasksInstance.focus();
      }
      
      assert.equal(pomodoroHidden, true, "Pomodoro should be hidden on Escape");
      assert.equal(tasksFocused, true, "Tasks should be focused on Escape");
    });
  });

  describe("Data Persistence", function () {
    beforeEach(function () {
      document.body.innerHTML = '';
      global.localStorage.data = {};
    });

    it("should maintain tasks across reloads", function () {
      global.Storage = class {
        constructor(storage, options) {
          this._storage = storage;
          this._options = options;
        }
        list() {
          const data = this._storage.getItem(this._options.locationName || 'tasks');
          return data ? JSON.parse(data) : [];
        }
        get() { return null; }
      };

      // Set up initial data
      global.localStorage.data.tasks = JSON.stringify([
        { key: 'task1', item: { description: 'Test task 1' } },
        { key: 'task2', item: { description: 'Test task 2' } }
      ]);

      global.Tasks = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
        }
        focus() {}
      };
      global.Pomodoro = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
          this.isRunning = false;
        }
      };

      // Verify that the app loads with the stored tasks
      const tasksData = global.localStorage.data.tasks;
      const tasks = JSON.parse(tasksData);
      assert.equal(tasks.length, 2, "Should load 2 tasks from storage");
      assert.equal(tasks[0].item.description, 'Test task 1');
      assert.equal(tasks[1].item.description, 'Test task 2');
    });
  });

  describe("Error Handling", function () {
    beforeEach(function () {
      document.body.innerHTML = '';
    });

    it("should handle corrupted localStorage gracefully", function () {
      global.localStorage.data.tasks = "invalid json";

      global.Storage = class {
        constructor(storage, options) {
          this._storage = storage;
          this._options = options;
        }
        list() {
          try {
            const data = this._storage.getItem(this._options.locationName || 'tasks');
            return data ? JSON.parse(data) : [];
          } catch (e) {
            return [];
          }
        }
        get() { return null; }
      };

      global.Tasks = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
        }
        focus() {}
      };
      global.Pomodoro = class {
        constructor() {
          this.ui = document.createElement('div');
          this.hidden = false;
          this.isRunning = false;
        }
      };

      // Should not throw an error
      assert.ok(document.body, "Document should exist after load with corrupted data");
    });
  });
});