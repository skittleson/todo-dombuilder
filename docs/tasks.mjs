import { input, ul, li, label, div, makeElement } from "./dombuilder.mjs";

import { Storage } from "./storage.mjs";

export class Tasks {
  /**
   *
   * @param {*} options
   */
  constructor(
    options = {
      externalTaskCallback: (task) => {},
    }
  ) {
    this._options = options;
    this._storage = new Storage(localStorage);
    this._ui = this._createUi();

    // refresh from storage
    this._storage.list().forEach((item) => {
      this._tasksUl.prepend(
        this.listItemEditableComponent(item.item.description, { id: item.key })
      );
    });
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

  focus() {
    this._newTaskInput.focus();
  }

  _createUi() {
    let errorMsg;
    return div(
      {
        className: "task-container",
      },
      (this._newTaskInput = input({
        className: "task-container-new-task",
        minLength: 5,
        required: true,
        placeholder: "Add a task",
        onkeydown: (keyDownEvent) => {
          switch (keyDownEvent.key) {
            case "Enter":
              if (this._newTaskInput.validity.valid) {
                this._tasksUl.prepend(
                  this.listItemEditableComponent(this._newTaskInput.value)
                );
                this._newTaskInput.value = "";
                errorMsg.innerText = "";
              } else {
                if (
                  this._newTaskInput.validity.tooShort ||
                  this._newTaskInput.validity.valueMissing
                ) {
                  errorMsg.innerText = `Task description too short. Min length is ${this._newTaskInput.minLength}`;
                  return;
                }
                errorMsg.innerText = "unknown input error";
              }
              break;
            default:
              break;
          }
        },
      })),
      (errorMsg = makeElement("small")),
      (this._tasksUl = ul({
        className: "tasks-list",
      })),
      // After "Tab"ing to the end, go back to the beginning. (hacky?)
      input({
        style: {
          width: "1px",
          border: 0,
        },
        onfocus: () => {
          // focus on checkbox
          this._tasksUl.firstChild.firstChild.focus();
        },
      })
    );
  }
  /**
   * One way binding of span and input text box
   * @param {String} description
   * @returns {HTMLElement}
   */
  listItemEditableComponent(description, options = { id: null }) {
    let editableDescription, staticDescription, taskCheckbox, taskLi, id;
    options.id != null ? (id = options.id) : (id = Date.now());
    this._storage.update(id, { description });
    return (taskLi = li(
      {
        className: "tasks-list-item",
        id: id,
      },
      (taskCheckbox = input({
        type: "checkbox",
        onkeydown: (keyPressDownEvent) => {
          switch (keyPressDownEvent.key) {
            case "ArrowUp":
              taskLi.previousSibling.firstChild.focus();
              break;
            case "ArrowDown":
              taskLi.nextSibling.firstChild.focus();
              break;
            case "w":
              taskLi.previousSibling.before(taskLi);
              taskLi.firstChild.focus();
              break;
            case "s":
              taskLi.nextSibling.after(taskLi);
              taskLi.firstChild.focus();
              break;
            case "d":
              this._options.externalTaskCallback({
                description: staticDescription.innerText,
              });
              break;
            case "Enter":
              staticDescription.click();
              break;
            case "c":
              this._tasksUl.prepend(
                this.listItemEditableComponent(`Copy ${staticDescription.innerText}`)
              );
              break;
            case "Delete":
            case "x":
              if (confirm(`Remove "${staticDescription.innerText}"?`)) {
                taskLi.parentNode.removeChild(taskLi);
                this._storage.remove(id);
              }
              break;
            default:
              break;
          }
        },
        onfocus: () => {
          taskLi.classList.add("tasks-list-item-focus");
        },
        onblur: () => {
          taskLi.classList.remove("tasks-list-item-focus");
        },
        onchange: () => {
          taskCheckbox.checked
            ? (taskLi.style.textDecoration = "line-through")
            : (taskLi.style.textDecoration = "none");
        },
      })),
      (staticDescription = label(
        {
          onclick: () => {
            staticDescription.hidden = true;
            editableDescription.hidden = false;
            editableDescription.focus();
            editableDescription.select();
          },
        },
        description
      )),
      (editableDescription = input({
        className: "tasks-list-item-edit",
        value: staticDescription.innerText,
        hidden: true,
        onfocusout: () => editableDescription.blur(),
        onkeydown: (keyDownEvent) => {
          if (keyDownEvent.key == "Enter") {
            editableDescription.blur();
          }
        },
        onblur: () => {
          editableDescription.hidden = true;
          staticDescription.hidden = false;
          staticDescription.innerText = editableDescription.value;

          // Focus on the checkbox to ensure user has context of current location.
          taskCheckbox.focus();
          this._storage.update(id, {
            description: staticDescription.innerText,
          });

          // no text, so delete it
          if (staticDescription.innerText.length == 0) {
            editableDescription.parentNode.parentNode.removeChild(
              editableDescription.parentNode
            );
            this._storage.remove(id);
          }
        },
      }))
    ));
  }
}
