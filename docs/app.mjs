import { a, div, makeElement } from "./dombuilder.mjs";
import { Pomodoro } from "./pomodoro.mjs";
import { Tasks } from "./tasks.mjs";
const shortcutHowTo = `Shortcuts:
 While writing a task:
 Tab - Move to task list below
 Enter - Add to task list below

 While on task in task list:
  Tab/DownArrow - Select next task
  Shift Tab/UpArrow - Select previous task 
  W - move task up
  S - move task down
  Enter - edit task
  SPACE - toggle complete/uncompleted task
  X / Delete key - delete task
  D - enter pomodoro timer.
  C - copy task
  Escape - leave input box. leave pomodoro timer.
  
 Global commands
   Tab + UpArrow - expands window to full size
   Tab + DownArrow - makes window smaller
`;

const pomodoroInstance = new Pomodoro();
const tasksInstance = new Tasks({
  externalTaskCallback: (task) => {
    pomodoroInstance.description(task.id, task.description);
    pomodoroInstance.hidden = false;
    tasksInstance.hidden = true;
  },
});
function mainUi() {
  pomodoroInstance.hidden = true;
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
      if (pomodoroInstance.isRunning) {
        if (!confirm("Stop timer for current task?")) {
          return;
        }
      }
      pomodoroInstance.hidden = true;
      tasksInstance.hidden = false;
      tasksInstance.focus();
    }
  };
  tasksInstance.focus();
  helpDialog.showModal();
}

function infoDialogUi() {
  return makeElement("dialog", makeElement("pre", shortcutHowTo));
}

mainUi();
