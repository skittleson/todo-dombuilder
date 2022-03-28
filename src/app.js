import {
  a,
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
    pomodoroInstance.hidden = false;
    tasksInstance.hidden = true;
  },
});
function mainUi(currentItems) {
  pomodoroInstance.hidden = true;
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
        ),
        makeElement("hr")
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
    } else if (event.key == "Escape") {

      // NOTE (2022-03-28, spencerk): No prevent default here to ensure inputs are properly escaped.
      pomodoroInstance.hidden = true;
      tasksInstance.hidden = false;
      tasksInstance.focus();
    }
  };
  tasksInstance.focus();
}

function infoDialogUi() {
  return makeElement("dialog", makeElement("pre", shortcutHowTo));
}

mainUi(["eggs", "milk", "cheese"]);
