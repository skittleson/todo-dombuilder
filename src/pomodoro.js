import {
  a,
  fragment,
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

export class Pomodoro {
  constructor(
    options = {
      closeCallback: {},
    }
  ) {
    this._options = options;
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

  /**
   * @param {String} value
   */
  set description(value) {
    this._descriptionElement.innerText = value;
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
            const isRunning = this._startStopToggle.dataset.running === "true";
            this._startStopToggle.value = isRunning ? "Start" : "Stop";
            this._startStopToggle.dataset.running = !isRunning;
            if (isRunning) {
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
          },
        }))
      ),
      (this._intervalInput = input({
        type: "number",
        step: 5,
        min: 5,
        max: 50,
        value: 1,
      }))
    );
  }

  startTimer(minutes, completeCallback) {
    const endDateTime = new Date();
    endDateTime.setMinutes(endDateTime.getMinutes() + minutes);
    console.log(endDateTime);
    const c = endDateTime.getTime();
    const uiRef = this._timerDisplay;
    const interval = setInterval(function () {
      const n = new Date().getTime();
      const d = c - n;
      const h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((d % (1000 * 60)) / 1000);
      uiRef.innerText = `${h}h ${m}m ${s}s`;
      if (d < 0) {
        uiRef.innerText = "EXPIRED";
        clearInterval(interval);
        if (completeCallback) {
          completeCallback();
        }
      }
      document.title = uiRef.innerText;
    }, 1000);
    return interval;
  }
}
