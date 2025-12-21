import { input, ul, li, label, div, makeElement } from "./dombuilder.mjs";
import { Storage } from "./storage.mjs";

const TASK_CONFIG = {
  MIN_LENGTH: 5,
  PLACEHOLDER: "Add a task",
  CLASSES: {
    CONTAINER: "task-container",
    NEW_TASK: "task-container-new-task",
    TASKS_LIST: "tasks-list",
    TASK_ITEM: "tasks-list-item",
    TASK_ITEM_FOCUS: "tasks-list-item-focus",
    TASK_EDIT: "tasks-list-item-edit",
  },
};

export class Tasks {
  constructor(options = { externalTaskCallback: () => {} }) {
    this._options = options;
    const isElectron = typeof window !== 'undefined' && window.electronAPI;
    this._storage = new Storage(localStorage, {
      useFileStorage: isElectron
    });
    this._ui = this._createUi();
  }

  get ui() {
    return this._ui;
  }

  get hidden() {
    return this._ui.hidden;
  }

  set hidden(value) {
    this._ui.hidden = value;
  }

  async loadTasks() {
    await this._loadStoredTasks();
  }

  focus() {
    this._newTaskInput?.focus();
  }

  async _loadStoredTasks() {
    const items = await this._storage.list();
    console.log('📝 TASKS: Loaded items:', items);
    items.forEach((item) => {
      const taskElement = this._createTaskItem(item.item.description, { id: item.key, isFromStorage: true });

      // Restore completion state if present
      if (item.item.completed) {
        const checkbox = taskElement.querySelector('input[type="checkbox"]');
        checkbox.checked = true;
        taskElement.style.textDecoration = "line-through";
      }
      this._tasksUl.prepend(taskElement);
    });
  }

  _createUi() {
    const errorMsg = makeElement("small");

    this._newTaskInput = this._createNewTaskInput(errorMsg);
    this._tasksUl = ul({ className: TASK_CONFIG.CLASSES.TASKS_LIST });
    const focusHelper = this._createFocusHelper();

    return div(
      { className: TASK_CONFIG.CLASSES.CONTAINER },
      this._newTaskInput,
      errorMsg,
      this._tasksUl,
      focusHelper
    );
  }

  _createNewTaskInput(errorMsg) {
    return input({
      className: TASK_CONFIG.CLASSES.NEW_TASK,
      minLength: TASK_CONFIG.MIN_LENGTH,
      required: true,
      placeholder: TASK_CONFIG.PLACEHOLDER,
      onkeydown: (event) => this._handleNewTaskKeydown(event, errorMsg),
    });
  }

  _createFocusHelper() {
    return input({
      style: { width: "1px", border: 0 },
      onfocus: () => {
        const firstChild = this._tasksUl.firstChild?.firstChild;
        firstChild?.focus();
      },
    });
  }

  _handleNewTaskKeydown(event, errorMsg) {
    switch (event.key) {
      case "Enter":
        this._handleTaskSubmission(errorMsg);
        break;
    }
  }

  _handleTaskSubmission(errorMsg) {
    if (this._newTaskInput.validity.valid) {
      this._tasksUl.prepend(
        this._createTaskItem(this._newTaskInput.value)
      );
      this._newTaskInput.value = "";
      errorMsg.innerText = "";
    } else {
      this._showValidationError(errorMsg);
    }
  }

  _showValidationError(errorMsg) {
    const { tooShort, valueMissing } = this._newTaskInput.validity;
    if (tooShort || valueMissing) {
      errorMsg.innerText = `Task description too short. Min length is ${TASK_CONFIG.MIN_LENGTH}`;
    } else {
      errorMsg.innerText = "unknown input error";
    }
  }

  _createTaskItem(description, options = { id: null, isFromStorage: false }) {
    const id = String(options.id ?? Date.now() + Math.random());

    // Only create/update storage entry if this is a new task (not from storage)
    if (!options.isFromStorage) {
      this._storage.add(id, { description, completed: false });
    }

    const elements = this._createTaskElements(id, description);
    const { taskLi, taskCheckbox, staticDescription, editableDescription } = elements;

    this._setupTaskEventHandlers(elements);

    return taskLi;
  }

  // Public method for backward compatibility with tests
  listItemEditableComponent(description, options = { id: null }) {
    return this._createTaskItem(description, options);
  }

  _createTaskElements(id, description) {
    const taskCheckbox = input({ type: "checkbox" });
    const staticDescription = label(
      { onclick: (event) => this._handleTaskEdit(event, event.target) },
      description
    );
    const editableDescription = input({
      className: TASK_CONFIG.CLASSES.TASK_EDIT,
      value: description,
      hidden: true,
      onfocusout: (event) => event.target.blur(),
      onkeydown: (event) => this._handleEditKeydown(event),
      onblur: (event) => this._handleEditBlur(event, id),
    });

    const taskLi = li(
      { className: TASK_CONFIG.CLASSES.TASK_ITEM, id },
      taskCheckbox,
      staticDescription,
      editableDescription
    );

    return { taskLi, taskCheckbox, staticDescription, editableDescription };
  }

  _setupTaskEventHandlers({ taskLi, taskCheckbox, staticDescription, editableDescription }) {
    taskCheckbox.onkeydown = (event) => this._handleTaskKeydown(event, taskLi, staticDescription);
    taskCheckbox.onfocus = () => taskLi.classList.add(TASK_CONFIG.CLASSES.TASK_ITEM_FOCUS);
    taskCheckbox.onblur = () => taskLi.classList.remove(TASK_CONFIG.CLASSES.TASK_ITEM_FOCUS);
    taskCheckbox.onchange = () => this._handleTaskCompletion(taskLi, taskCheckbox);
  }

  _handleTaskKeydown(event, taskLi, staticDescription) {
    const handlers = {
      ArrowUp: () => this._navigateToTask(taskLi.previousSibling?.firstChild),
      ArrowDown: () => this._navigateToTask(taskLi.nextSibling?.firstChild),
      w: () => this._moveTaskUp(taskLi),
      s: () => this._moveTaskDown(taskLi),
      d: () => this._handlePomodoroTrigger(staticDescription),
      Enter: () => this._startEditing(staticDescription),
      c: () => this._copyTask(staticDescription),
      Delete: () => this._deleteTask(taskLi, staticDescription),
      x: () => this._deleteTask(taskLi, staticDescription),
    };

    handlers[event.key]?.();
  }

  _navigateToTask(nextElement) {
    nextElement?.focus();
  }

  _moveTaskUp(taskLi) {
    taskLi.previousSibling?.before(taskLi);
    taskLi.firstChild?.focus();
  }

  _moveTaskDown(taskLi) {
    taskLi.nextSibling?.after(taskLi);
    taskLi.firstChild?.focus();
  }

  _handlePomodoroTrigger(staticDescription) {
    this._options.externalTaskCallback({
      description: staticDescription.innerText,
      id: parseInt(staticDescription.parentElement.id),
    });
  }

  _startEditing(staticDescription) {
    this._tasksUl.childNodes.forEach((child) => child.firstChild?.blur());
    staticDescription.click();
  }

  _copyTask(staticDescription) {
    this._tasksUl.prepend(
      this._createTaskItem(`Copy ${staticDescription.innerText}`)
    );
  }

  _deleteTask(taskLi, staticDescription) {
    if (confirm(`Remove "${staticDescription.innerText}"?`)) {
      this._focusAfterDeletion(taskLi);
      taskLi.parentNode?.removeChild(taskLi);
      this._storage.remove(parseInt(taskLi.id));
    }
  }

  _focusAfterDeletion(taskLi) {
    const nextElement = taskLi.nextSibling?.firstChild;
    const prevElement = taskLi.previousSibling?.firstChild;

    nextElement?.focus() || prevElement?.focus() || this._newTaskInput?.focus();
  }

  _handleTaskEdit(event, staticDescription) {
    const editableDescription = staticDescription.nextElementSibling;
    staticDescription.hidden = true;
    editableDescription.hidden = false;
    editableDescription.focus();
    editableDescription.select();
  }

  _handleEditKeydown(event) {
    if (event.key === "Enter") {
      event.target.blur();
    }
  }

  _handleEditBlur(event, id) {
    const editableDescription = event.target;
    const staticDescription = editableDescription.previousElementSibling;
    const taskCheckbox = staticDescription.previousElementSibling;

    editableDescription.hidden = true;
    staticDescription.hidden = false;
    staticDescription.innerText = editableDescription.value;

    taskCheckbox.focus();
    this._storage.update(id, { description: staticDescription.innerText });

    if (staticDescription.innerText.length === 0) {
      editableDescription.parentNode?.remove();
      this._storage.remove(id);
    }
  }

  _handleTaskCompletion(taskLi, taskCheckbox) {
    taskLi.style.textDecoration = taskCheckbox.checked ? "line-through" : "none";

    const stringId = String(taskLi.id);
      this._storage.get(stringId).then(existingTask => {
        if (existingTask && existingTask.item) {
          const updatedTask = {
            ...existingTask.item,
            completed: taskCheckbox.checked
          };
          this._storage.update(stringId, updatedTask);
        }
      });

    if (taskCheckbox.checked) {
      const prevElement = taskLi.previousSibling?.firstChild;
      prevElement?.focus() || this._newTaskInput?.focus();
      taskLi.parentNode?.lastChild?.after(taskLi);
    }
  }
}
