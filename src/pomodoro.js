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
  }

  /**
   * @param {String} value
   */
  set description(value) {
    this._descriptionElement.innerText = value;
  }

  _createUi() {
    this._ui = div(
      makeElement("h2", "Pomodoro Timer"),
      ((this._timerDisplay = makeElement("h3")), "0m 0s"),
      (this._descriptionElement = div("-")),
      div(
        (this._startStopToggle = button("Start", {
          className: "button",
        }))
      ),
      (this._intervalInput = input({
        type: "number",
        step: 5,
        min: 5,
        max: 50,
        value: 5,
      }))
    );

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
