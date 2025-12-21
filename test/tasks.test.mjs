import assert from "assert";
import { JSDOM } from "jsdom";
import { Tasks } from "../docs/tasks.mjs";

describe("Tasks", function () {
  let dom;
  let tasks;
  let mockStorage;
  let mockExternalCallback;

  beforeEach(function () {
    dom = new JSDOM('<!DOCTYPE html><div id="container"></div>', { 
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

    mockStorage = {
      data: {},
      getItem: function(key) { return this.data[key] || null; },
      setItem: function(key, value) { this.data[key] = value; }
    };

    mockExternalCallback = { calls: [] };
    tasks = new Tasks({
      externalTaskCallback: (task) => mockExternalCallback.calls.push(task)
    });
  });

  afterEach(function () {
    // Clear any remaining timers
    if (global.setInterval && global.clearInterval) {
      const maxId = setTimeout(() => {}, 0);
      for (let i = 1; i <= maxId; i++) {
        try {
          global.clearInterval(i);
          clearTimeout(i);
        } catch (e) {
          // Ignore errors
        }
      }
    }
    dom.window.close();
  });

  describe("constructor", function () {
    it("should create UI element", function () {
      assert.ok(tasks.ui);
      assert.equal(tasks.ui.className, "task-container");
    });

    it("should initialize with default options", function () {
      const defaultTasks = new Tasks();
      assert.ok(defaultTasks.ui);
    });

    it("should load existing tasks from storage", function () {
      const testStorage = {
        data: { tasks: JSON.stringify([{ key: "test-key", item: { description: "test task" } }]) },
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; }
      };
      const tasksWithStorage = new Tasks();
      tasksWithStorage._storage._storage = testStorage;
      
      assert.ok(tasksWithStorage.ui);
    });
  });

  describe("ui property", function () {
    it("should return the UI element", function () {
      assert.equal(tasks.ui.className, "task-container");
    });
  });

  describe("hidden property", function () {
    it("should get and set hidden state", function () {
      assert.equal(tasks.hidden, false);
      tasks.hidden = true;
      assert.equal(tasks.hidden, true);
    });
  });

  describe("focus", function () {
    it("should focus on new task input", function () {
      const mockFocus = { called: false };
      tasks._newTaskInput.focus = () => { mockFocus.called = true; };
      tasks.focus();
      assert.equal(mockFocus.called, true);
    });
  });

  describe("listItemEditableComponent", function () {
    it("should create an editable list item", function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      assert.equal(listItem.tagName, "LI");
      assert.equal(listItem.className, "tasks-list-item");
      assert.ok(listItem.querySelector('input[type="checkbox"]'));
      assert.ok(listItem.querySelector('label'));
      assert.ok(listItem.querySelector('input.tasks-list-item-edit'));
    });

    it("should use provided ID if given", function () {
      const listItem = tasks.listItemEditableComponent("Test task", { id: "custom-id" });
      assert.equal(listItem.id, "custom-id");
    });

    it("should generate ID if not provided", function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      assert.ok(listItem.id);
      assert.notEqual(listItem.id, "");
    });
  });

  describe("keyboard navigation", function () {
    it("should add task on Enter key with valid input", function () {
      const input = tasks._newTaskInput;
      input.value = "Valid task description";
      input.minLength = 5;
      
      Object.defineProperty(input, 'validity', {
        value: { valid: true },
        writable: true
      });
      
      const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);
      
      assert.equal(tasks._tasksUl.children.length, 1);
    });

    it("should not add task on Enter key with invalid input", function () {
      const input = tasks._newTaskInput;
      input.value = "bad";
      input.minLength = 5;
      
      Object.defineProperty(input, 'validity', {
        value: { 
          valid: false, 
          tooShort: true,
          valueMissing: false 
        },
        writable: true
      });
      
      const event = new dom.window.KeyboardEvent('keydown', { key: 'Enter' });
      input.dispatchEvent(event);
      
      assert.equal(tasks._tasksUl.children.length, 0);
    });
  });

  describe("task deletion", function () {
    beforeEach(function () {
      global.confirm = () => true;
    });

    it("should delete task with confirmation", function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      tasks._tasksUl.appendChild(listItem);
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      const event = new dom.window.KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(event, 'target', { value: checkbox });
      
      checkbox.dispatchEvent(event);
      
      assert.equal(tasks._tasksUl.children.length, 0);
    });
  });

  describe("task editing", function () {
    it("should allow editing task description", function () {
      const listItem = tasks.listItemEditableComponent("Original task");
      tasks._tasksUl.appendChild(listItem);
      
      const label = listItem.querySelector('label');
      const input = listItem.querySelector('input.tasks-list-item-edit');
      
      label.click();
      assert.equal(input.hidden, false);
      assert.equal(label.hidden, true);
      
      input.value = "Updated task";
      const blurEvent = new dom.window.Event('blur');
      input.dispatchEvent(blurEvent);
      
      assert.equal(label.hidden, false);
      assert.equal(input.hidden, true);
      assert.equal(label.innerText, "Updated task");
    });

    it("should delete task when description is empty", function () {
      const listItem = tasks.listItemEditableComponent("Task to delete");
      tasks._tasksUl.appendChild(listItem);
      
      const label = listItem.querySelector('label');
      const input = listItem.querySelector('input.tasks-list-item-edit');
      
      label.click();
      input.value = "";
      const blurEvent = new dom.window.Event('blur');
      input.dispatchEvent(blurEvent);
      
      assert.equal(tasks._tasksUl.children.length, 0);
    });
  });

  describe("task completion", function () {
    it("should apply strikethrough when completed", function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      tasks._tasksUl.appendChild(listItem);
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      
      const changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      assert.equal(listItem.style.textDecoration, "line-through");
    });

it("should update storage when task is completed", async function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      tasks._tasksUl.appendChild(listItem);
      
      // Wait for task to be saved to storage
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      
      const changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      // Wait for async completion update to finish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const storedTask = await tasks._storage.get(listItem.id);
      assert.ok(storedTask, "Task should be stored");
      assert.equal(storedTask.item.completed, true, "Task should be marked as completed in storage");
    });

    it("should persist completion state after page reload", async function () {
      // Create a task and complete it
      const listItem = tasks.listItemEditableComponent("Test task");
      tasks._tasksUl.appendChild(listItem);
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      
      const changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      // Wait for async completion update to finish
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Debug: Check storage before reload
      const itemsBeforeReload = await tasks._storage.list();
      console.log('Items before reload:', itemsBeforeReload);
      
      // Clear the UI to simulate page reload
      tasks._tasksUl.innerHTML = '';
      
      // Reload tasks from storage
      await tasks._loadStoredTasks();
      
      // Debug: Check what was loaded
      console.log('UI children after reload:', tasks._tasksUl.children.length);
      
      // Check if the task is still completed after reload
      const reloadedTask = tasks._tasksUl.querySelector('li');
      assert.ok(reloadedTask, "Task should be loaded after reload");
      assert.equal(reloadedTask.querySelector('input[type="checkbox"]').checked, true, "Task should remain completed after reload");
      assert.equal(reloadedTask.style.textDecoration, "line-through", "Task should have strikethrough after reload");
    });

    it("should update storage when task is uncompleted", function () {
      const listItem = tasks.listItemEditableComponent("Test task");
      tasks._tasksUl.appendChild(listItem);
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      
      // First complete the task
      checkbox.checked = true;
      let changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      // Then uncomplete it
      checkbox.checked = false;
      changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      const storedTask = tasks._storage.get(parseInt(listItem.id));
      assert.ok(storedTask, "Task should be stored");
      assert.equal(storedTask.item.completed, false, "Task should be marked as uncompleted in storage");
    });

    it("should preserve existing task properties when updating completion status", function () {
      const listItem = tasks.listItemEditableComponent("Original task description");
      tasks._tasksUl.appendChild(listItem);
      
      const checkbox = listItem.querySelector('input[type="checkbox"]');
      checkbox.checked = true;
      
      const changeEvent = new dom.window.Event('change');
      checkbox.dispatchEvent(changeEvent);
      
      const storedTask = tasks._storage.get(parseInt(listItem.id));
      assert.ok(storedTask, "Task should be stored");
      assert.equal(storedTask.item.description, "Original task description", "Task description should be preserved");
      assert.equal(storedTask.item.completed, true, "Task should be marked as completed in storage");
    });

    it("should restore completion status when loading from storage", function () {
      // Simulate storage with a completed task
      const testStorage = {
        data: { 
          tasks: JSON.stringify([
            { key: "123", item: { description: "Completed task", completed: true } },
            { key: "456", item: { description: "Incomplete task", completed: false } }
          ]) 
        },
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; }
      };

      const tasksWithStorage = new Tasks();
      tasksWithStorage._storage._storage = testStorage;
      
      // Force reload of stored tasks
      tasksWithStorage._tasksUl.innerHTML = '';
      tasksWithStorage._loadStoredTasks();
      
      const taskElements = tasksWithStorage._tasksUl.children;
      assert.equal(taskElements.length, 2, "Should load both tasks from storage");
      
      const completedTask = Array.from(taskElements).find(el => el.id === "123");
      const incompleteTask = Array.from(taskElements).find(el => el.id === "456");
      
      assert.ok(completedTask, "Should find completed task");
      assert.ok(incompleteTask, "Should find incomplete task");
      
      assert.equal(completedTask.style.textDecoration, "line-through", "Completed task should have strikethrough");
      assert.equal(completedTask.querySelector('input[type="checkbox"]').checked, true, "Completed task checkbox should be checked");
      
      assert.ok(incompleteTask.style.textDecoration !== "line-through", "Incomplete task should not have strikethrough");
      assert.equal(incompleteTask.querySelector('input[type="checkbox"]').checked, false, "Incomplete task checkbox should be unchecked");
    });

    it("should preserve completion status across multiple reloads", function () {
      // Simulate storage with completed task
      const testStorage = {
        data: { 
          tasks: JSON.stringify([
            { key: "789", item: { description: "Persistent completed task", completed: true } }
          ]) 
        },
        getItem: function(key) { return this.data[key] || null; },
        setItem: function(key, value) { this.data[key] = value; }
      };

      // First load
      const tasks1 = new Tasks();
      tasks1._storage._storage = testStorage;
      tasks1._tasksUl.innerHTML = '';
      tasks1._loadStoredTasks();
      
      // Verify first load
      const task1 = tasks1._tasksUl.querySelector('[id="789"]');
      assert.equal(task1.style.textDecoration, "line-through", "Task should be completed on first load");
      
      // Simulate second load (like page refresh)
      const tasks2 = new Tasks();
      tasks2._storage._storage = testStorage;
      tasks2._tasksUl.innerHTML = '';
      tasks2._loadStoredTasks();
      
      // Verify second load - completion should still be preserved
      const task2 = tasks2._tasksUl.querySelector('[id="789"]');
      assert.equal(task2.style.textDecoration, "line-through", "Task should still be completed on second load");
      assert.equal(task2.querySelector('input[type="checkbox"]').checked, true, "Checkbox should remain checked");
      
      // Verify storage still has completion status
      const storedTask = tasks2._storage.get("789");
      assert.equal(storedTask.item.completed, true, "Storage should preserve completion status");
    });
  });
});