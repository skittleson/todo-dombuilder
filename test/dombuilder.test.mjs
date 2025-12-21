import assert from "assert";
import {
  makeElement,
  a,
  button,
  div,
  p,
  span,
  ul,
  li,
  input,
  label,
  style,
  slot,
  table,
  tr,
  td,
  th,
  fragment,
  template,
  text,
  svg
} from "../docs/dombuilder.mjs";

describe("DOM Builder", function () {
  let dom;

  beforeEach(function () {
    dom = new JSDOM('<!DOCTYPE html><div id="container"></div>', { 
      url: 'http://localhost',
      pretendToBeVisual: true,
      resources: 'usable'
    });
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(function () {
    dom.window.close();
  });

  describe("makeElement", function () {
    it("should create basic element", function () {
      const element = makeElement("div");
      assert.equal(element.tagName, "DIV");
    });

    it("should create element with text content", function () {
      const element = makeElement("div", "Hello World");
      assert.equal(element.textContent, "Hello World");
    });

    it("should create element with properties", function () {
      const element = makeElement("input", { type: "text", value: "test" });
      assert.equal(element.type, "text");
      assert.equal(element.value, "test");
    });

    it("should create element with child elements", function () {
      const child1 = makeElement("span", "Child 1");
      const child2 = makeElement("span", "Child 2");
      const parent = makeElement("div", child1, child2);
      
      assert.equal(parent.children.length, 2);
      assert.equal(parent.children[0].textContent, "Child 1");
      assert.equal(parent.children[1].textContent, "Child 2");
    });

    it("should handle mixed children", function () {
      const parent = makeElement("div", "Text", makeElement("span", "Element"));
      assert.equal(parent.childNodes.length, 2);
      assert.equal(parent.childNodes[0].textContent, "Text");
      assert.equal(parent.childNodes[1].tagName, "SPAN");
    });

    it("should handle empty parameters", function () {
      const element = makeElement("div");
      assert.equal(element.tagName, "DIV");
      assert.equal(element.children.length, 0);
    });

    it("should set style properties", function () {
      const element = makeElement("div", { style: { color: "red", fontSize: "16px" } });
      assert.equal(element.style.color, "red");
      assert.equal(element.style.fontSize, "16px");
    });

    it("should set dataset properties", function () {
      const element = makeElement("div", { dataset: { test: "value", number: "123" } });
      assert.equal(element.dataset.test, "value");
      assert.equal(element.dataset.number, "123");
    });

    it("should handle attribute exceptions", function () {
      const element = makeElement("div", { "aria-label": "Test Label", role: "button" });
      assert.equal(element.getAttribute("aria-label"), "Test Label");
      assert.equal(element.getAttribute("role"), "button");
    });

    it("should handle @ prefix attributes", function () {
      const element = makeElement("div", { "@custom-attr": "value" });
      assert.equal(element.getAttribute("custom-attr"), "value");
    });

    it("should ignore invalid property values", function () {
      const element = makeElement("div", { style: { invalidProp: "value" } });
      assert.ok(element.style);
    });

    it("should handle function properties", function () {
      let clicked = false;
      const element = makeElement("button", { onclick: () => { clicked = true; } });
      element.click();
      assert.equal(clicked, true);
    });
  });

  describe("element factory functions", function () {
    it("should create anchor elements", function () {
      const element = a({ href: "#" }, "Click me");
      assert.equal(element.tagName, "A");
      assert.ok(element.href.includes("#"));
      assert.equal(element.textContent, "Click me");
    });

    it("should create button elements", function () {
      const element = button({ type: "submit" }, "Submit");
      assert.equal(element.tagName, "BUTTON");
      assert.equal(element.type, "submit");
      assert.equal(element.textContent, "Submit");
    });

    it("should create div elements", function () {
      const element = div({ className: "container" }, "Content");
      assert.equal(element.tagName, "DIV");
      assert.equal(element.className, "container");
    });

    it("should create paragraph elements", function () {
      const element = p({}, "Paragraph text");
      assert.equal(element.tagName, "P");
      assert.equal(element.textContent, "Paragraph text");
    });

    it("should create span elements", function () {
      const element = span({ id: "my-span" }, "Span text");
      assert.equal(element.tagName, "SPAN");
      assert.equal(element.id, "my-span");
    });

    it("should create list elements", function () {
      const list = ul({}, 
        li({}, "Item 1"),
        li({}, "Item 2")
      );
      assert.equal(list.tagName, "UL");
      assert.equal(list.children.length, 2);
      assert.equal(list.children[0].tagName, "LI");
      assert.equal(list.children[1].tagName, "LI");
    });

    it("should create input elements", function () {
      const element = input({ type: "text", value: "test" });
      assert.equal(element.tagName, "INPUT");
      assert.equal(element.type, "text");
      assert.equal(element.value, "test");
    });

    it("should create label elements", function () {
      const element = label({ htmlFor: "input-id" }, "Label text");
      assert.equal(element.tagName, "LABEL");
      assert.equal(element.htmlFor, "input-id");
      assert.equal(element.textContent, "Label text");
    });

    it("should create style elements", function () {
      const element = style({}, "body { color: red; }");
      assert.equal(element.tagName, "STYLE");
      assert.equal(element.textContent, "body { color: red; }");
    });

    it("should create slot elements", function () {
      const element = slot({ name: "my-slot" });
      assert.equal(element.tagName, "SLOT");
      assert.equal(element.name, "my-slot");
    });

    it("should create table elements", function () {
      const tableElement = table({},
        tr({},
          th({}, "Header"),
          td({}, "Cell")
        )
      );
      assert.equal(tableElement.tagName, "TABLE");
      assert.equal(tableElement.querySelector("tr").tagName, "TR");
      assert.equal(tableElement.querySelector("th").tagName, "TH");
      assert.equal(tableElement.querySelector("td").tagName, "TD");
    });
  });

  describe("fragment", function () {
    it("should create document fragment", function () {
      const frag = fragment(
        div({}, "Item 1"),
        span({}, "Item 2")
      );
      assert.equal(frag.nodeType, 11); // DocumentFragment node type
      assert.equal(frag.children.length, 2);
    });
  });

  describe("template", function () {
    it("should create template element", function () {
      const templ = template(
        div({}, "Template content")
      );
      assert.equal(templ.tagName, "TEMPLATE");
      assert.equal(templ.content.children.length, 1);
      assert.equal(templ.content.querySelector("div").textContent, "Template content");
    });
  });

  describe("text", function () {
    it("should create text node", function () {
      const textNode = text("Hello");
      assert.equal(textNode.nodeType, 3); // Text node type
      assert.equal(textNode.textContent, "Hello");
    });
  });

  describe("svg", function () {
    it("should create SVG element", function () {
      const svgString = '<svg width="100" height="100"><circle cx="50" cy="50" r="40" /></svg>';
      const svgElement = svg(svgString);
      assert.equal(svgElement.tagName, "svg");
      assert.equal(svgElement.getAttribute("width"), "100");
      assert.equal(svgElement.querySelector("circle").tagName, "circle");
    });

    it("should strip title when requested", function () {
      const svgString = '<svg><title>Test</title><circle /></svg>';
      const svgElement = svg(svgString, true);
      assert.equal(svgElement.querySelector("title"), null);
      assert.equal(svgElement.querySelector("circle").tagName, "circle");
    });
  });

  describe("complex scenarios", function () {
    it("should handle deeply nested structures", function () {
      const complex = div(
        { className: "outer" },
        div(
          { className: "inner" },
          ul(
            {},
            li({}, span({}, "Nested item 1")),
            li({}, span({}, "Nested item 2"))
          )
        )
      );
      
      assert.equal(complex.className, "outer");
      assert.equal(complex.querySelector(".inner").className, "inner");
      assert.equal(complex.querySelectorAll("li").length, 2);
      assert.equal(complex.querySelectorAll("span").length, 2);
    });

    it("should handle event handlers properly", function () {
      let clickCount = 0;
      const buttonElement = button({
        onclick: () => clickCount++
      }, "Click me");
      
      buttonElement.click();
      buttonElement.click();
      assert.equal(clickCount, 2);
    });

    it("should handle arrays as children", function () {
      const children = [
        span({}, "Child 1"),
        span({}, "Child 2"),
        span({}, "Child 3")
      ];
      const parent = div({}, children);
      assert.equal(parent.children.length, 3);
    });

    it("should handle mixed children types", function () {
      const parent = div(
        {},
        "Text content",
        span({}, "Span content"),
        ["Array", "content"]
      );
      assert.equal(parent.childNodes.length, 4);
    });
  });
});