import { input, div, makeElement } from "./dombuilder.mjs";
import { Storage } from "./storage.mjs";

export class Pomodoro {
  constructor(
    options = {
      closeCallback: {},
    }
  ) {
    this._options = options;
    this._storage = new Storage(localStorage, { locationName: "taskNotes" });
    this._createUi();
  }

  /**
   * @returns {HTMLElement}
   */
  get ui() {
    return this._ui;
  }

  get hidden() {
    return this._ui.hidden;
  }

  set hidden(value) {
    this._ui.hidden = value;

    // Stop playing audio when the pomodoro timer is hidden
    if (value) {
      this._audio.pause();
    } else {
      this._startStopToggle.focus();
    }
  }

  get isRunning() {
    return this._startStopToggle.dataset.running === "true";
  }

  set isRunning(value) {
    this._startStopToggle.dataset.running = value;
  }

  description(id, description) {
    this._notesTextarea.value = "";
    this._descriptionElement.innerText = description;
    this._descriptionElement.dataset.id = id;
    const taskNotes = this._storage.get(id);
    if(taskNotes){
      this._notesTextarea.value = taskNotes;
    }
  }

  _createUi() {
    this._ui = div(
      (this._timerDisplay = div({ className: "timer" }, "0m 0s")),
      (this._descriptionElement = div("-")),
      (this._audio = makeElement(
        "audio",
        {
          preload: "auto",
          src: "default.mp3",
          loop: true,
        },
        "Your browser does not support the audio element"
      )),
      div(
        (this._startStopToggle = input({
          dataset: {
            running: false,
          },
          className: "timer-button",
          type: "button",
          value: "Start",
          onclick: () => {
            this._startStopToggle.value = this.isRunning ? "Start" : "Stop";

            if (this.isRunning) {
              clearInterval(this._interval);
              this._intervalInput.disabled = false;
              this._audio.pause();
            } else {
              this._interval = this.startTimer(
                Number(this._intervalInput.value),
                () => {
                  this._audio.play();
                }
              );
              this._intervalInput.disabled = true;
            }
            this.isRunning = !this.isRunning;
          },
        })),
        (this._intervalInput = input({
          classList: "time-selector",
          type: "number",
          step: 5,
          min: 5,
          max: 50,
          value: 5,
        }))
      ),
      (this._notesTextarea = makeElement("textarea", {
        className: "notes",
        placeholder: "write on-going notes",
        onkeydown: () => {
          this._storage.update(
            Number(this._descriptionElement.dataset.id),
            this._notesTextarea.value
          );
        },
      }))
    );
  }

  startTimer(minutes, completeCallback) {
    const endDateTime = new Date();
    endDateTime.setMinutes(endDateTime.getMinutes() + minutes);
    const onStartNow = endDateTime.getTime();
    const timerDisplayUiReference = this._timerDisplay;
    timerDisplayUiReference.innerText = "-";
    const interval = setInterval(function () {
      const now = new Date().getTime();
      const d = onStartNow - now;
      const h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((d % (1000 * 60)) / 1000);
      timerDisplayUiReference.innerText = `${h}h ${m}m ${s}s`;
      if (d < 0) {
        timerDisplayUiReference.innerText = "EXPIRED";
        clearInterval(interval);
        if (completeCallback) {
          completeCallback();
        }
      }
      document.title = timerDisplayUiReference.innerText;
    }, 1000);
    return interval;
  }
}
