import { a, div, makeElement } from "./dombuilder.mjs";
import { Pomodoro } from "./pomodoro.mjs";
import { Tasks } from "./tasks.mjs";

const SHORTCUT_HELP = `Shortcuts:
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

async function createApp() {
  const pomodoroInstance = new Pomodoro();
  let tasksInstance;

  const taskCallback = (task) => {
    pomodoroInstance.description(task.id, task.description);
    pomodoroInstance.hidden = false;
    tasksInstance.hidden = true;
  };

  tasksInstance = new Tasks({
    externalTaskCallback: taskCallback,
  });
  await tasksInstance.loadTasks();

  function createHelpDialog() {
    return makeElement("dialog", makeElement("pre", SHORTCUT_HELP));
  }

  function handleKeyDown(event, helpDialog) {
    switch (event.key) {
      case "F1":
        event.preventDefault();
        helpDialog.open ? helpDialog.close() : helpDialog.showModal();
        break;
      case "Escape":
        if (pomodoroInstance.isRunning && !confirm("Stop timer for current task?")) {
          return;
        }
        pomodoroInstance.hidden = true;
        tasksInstance.hidden = false;
        tasksInstance.focus();
        break;
    }
  }

  function initialize() {
    pomodoroInstance.hidden = true;

    const helpDialog = createHelpDialog();

    const header = makeElement(
      "h1",
      "Tasks",
      a(
        { className: "help-link", onclick: () => helpDialog.showModal() },
        "F1 Help"
      ),
      makeElement("hr")
    );

    document.body.append(
      div(header),
      helpDialog,
      tasksInstance.ui,
      pomodoroInstance.ui
    );

    document.body.onkeydown = (event) => handleKeyDown(event, helpDialog);

    tasksInstance.focus();
    helpDialog.showModal();
  }

  return { initialize };
}

const { initialize } = await createApp();
initialize();
