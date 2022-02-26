import {
  a,
  button,
  input,
  ul,
  li,
  label,
  span,
  p,
  div,
  makeElement,
} from "../node_modules/@kanmf/dombuilder/index.mjs";
import { Pomodoro } from "./pomodoro.js";
const shortcutHowTo = `Shortcuts:
 While writing a task:
 Tab - Move to task list below

 While on task in task list:
  W - move task up
  S - move task down
  Enter - edit task
  SPACE - toggle complete/uncompleted task
  X - delete task
 
 While editing a task in task list:
 Tab - Save and move to next task
 Shift Tab - Save and move to previous task
  `;

const tasksUl = ul({
  className: "tasks-list",
});
const pomodoroInstance = new Pomodoro();
function mainUi(currentItems) {
  let newTaskInput, helpDialog, errorMsg;
  const descriptionFunc = function (description) {
    pomodoroInstance.description = description;
  };
  document.body.append(
    div(
      makeElement(
        "h1",
        "Tasks",
        a(
          {
            className: "help-link",
            onclick: () => helpDialog.showModal(),
          },
          "F1 Help"
        )
      )
    ),
    div(
      {
        className: "task-container",
      },
      (newTaskInput = input({
        className: "task-container-new-task",
        minLength: 5,
        required: true,
        placeholder: "Add a task",
        onkeydown: (keyDownEvent) => {
          switch (keyDownEvent.key) {
            case "Enter":
              if (newTaskInput.validity.valid) {
                tasksUl.prepend(
                  listItemEditableComponent(newTaskInput.value, descriptionFunc)
                );
                newTaskInput.value = "";
                errorMsg.innerText = "";
              } else {
                if (
                  newTaskInput.validity.tooShort ||
                  newTaskInput.validity.valueMissing
                ) {
                  errorMsg.innerText = `Task description too short. Min length is ${newTaskInput.minLength}`;
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
      tasksUl,
      // After "Tab"ing to the end, go back to the beginning. (hacky?)
      input({
        style: {
          width: "1px",
          border: 0,
        },
        onfocus: () => {
          // focus on checkbox
          tasksUl.firstChild.firstChild.focus();
        },
      })
    ),
    (helpDialog = infoDialogUi()),
    pomodoroInstance.ui
  );
  newTaskInput.focus();

  document.body.onkeydown = (event) => {
    if (event.key == "F1") {
      event.preventDefault();
      helpDialog.open ? helpDialog.close() : helpDialog.showModal();
    }
    // console.log(event);
  };
  // Add existing items
  currentItems.forEach((item) =>
    tasksUl.append(listItemEditableComponent(item, descriptionFunc))
  );
}

/**
 * One way binding of span and input text box
 * @param {String} description
 * @returns {HTMLElement}
 */
function listItemEditableComponent(description, keyboardActionCallback) {
  let editableDescription, staticDescription, taskCheckbox, taskLi;
  return (taskLi = li(
    {
      className: "tasks-list-item",
      id: Math.floor(Math.random() * 110000),
    },
    (taskCheckbox = input({
      type: "checkbox",
      onkeydown: (keyPressDownEvent) => {
        switch (keyPressDownEvent.key) {
          case "w":
            taskLi.previousSibling.before(taskLi);
            taskLi.firstChild.focus();
            break;
          case "s":
            taskLi.nextSibling.after(taskLi);
            taskLi.firstChild.focus();
            break;
          case "d":
            keyboardActionCallback(staticDescription.innerText);
            break;
          case "Enter":
            staticDescription.click();
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
        },
      },
      description
    )),
    (editableDescription = input({
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

        // no text, so delete it
        if (staticDescription.innerText.length == 0) {
          editableDescription.parentNode.parentNode.removeChild(
            editableDescription.parentNode
          );

          //TODO: where should the focus go?
        }
      },
    }))
  ));
}

function infoDialogUi() {
  return makeElement("dialog", makeElement("pre", shortcutHowTo));
}

function beep() {
  const snd = new Audio(
    "data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU="
  );
  snd.play();
}

mainUi(["eggs", "milk", "cheese"]);

function bind(el) {
  return {
    set age(v) {
      el.value = v;
    },
    get age() {
      return el.value;
    },
  };
}
