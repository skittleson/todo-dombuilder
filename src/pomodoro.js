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

export class Pomodoro {
  constructor() {
    this._ui = this._createUi();
  }

  /**
   * @returns {HTMLElement}
   */
  get ui() {
    return this._ui;
  }

  set description(v) {
    this._description = v;
  }

  _createUi() {
    let intervalInput, timerDisplay, startStopToggle;

    const uiOptions = div(
      makeElement("h2", "Pomodoro Timer"),
      ((timerDisplay = makeElement("h3")), "0m 0s"),
      (this._descriptionElement = span("-")),
      div(
        (startStopToggle = button("Start", {
          className: "button",
        }))
      ),
      (intervalInput = input({
        type: "number",
        step: 5,
        min: 5,
        max: 50,
        value: 5,
      }))
    );

    return uiOptions;

    // const c = new Date("July 18, 2023 23:30:20").getTime();
    // const uiRef = this._ui;
    // const t = setInterval(function () {
    //   const n = new Date().getTime();
    //   const d = c - n;
    //   const da = Math.floor(d / (1000 * 60 * 60 * 24));
    //   const h = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    //   const m = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
    //   const s = Math.floor((d % (1000 * 60)) / 1000);
    //   uiRef.innerText = da + "d " + h + "h " + m + "m " + s + "s ";
    //   if (d < 0) {
    //     clearInterval(t);
    //     uiRef.innerText = "EXPIRED";
    //   }
    // }, 1000);
  }
}
