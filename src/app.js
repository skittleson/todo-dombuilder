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
import { Tasks } from "./tasks.js";
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

const pomodoroInstance = new Pomodoro();
const tasksInstance = new Tasks({
  externalTaskCallback: (task) => {
    pomodoroInstance.description = task.description;
  },
});
function mainUi(currentItems) {
  tasksInstance.add(currentItems);
  let helpDialog;
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
    (helpDialog = infoDialogUi()),
    tasksInstance.ui,
    pomodoroInstance.ui
  );
  document.body.onkeydown = (event) => {
    if (event.key == "F1") {
      event.preventDefault();
      helpDialog.open ? helpDialog.close() : helpDialog.showModal();
    }
  };
}

function infoDialogUi() {
  return makeElement("dialog", makeElement("pre", shortcutHowTo));
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
