import { JSDOM } from 'jsdom';

// Set up DOM environment for tests
const dom = new JSDOM('<!DOCTYPE html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM available globally
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;
global.Text = dom.window.Text;
global.Node = dom.window.Node;
global.JSDOM = JSDOM;

// Mock HTMLMediaElement methods
global.HTMLMediaElement = dom.window.HTMLMediaElement;
if (global.HTMLMediaElement) {
  global.HTMLMediaElement.prototype.pause = function() {};
  global.HTMLMediaElement.prototype.play = function() {
    this.playCalled = true;
  };
}

// Mock confirm
global.confirm = function() { return true; };

// Mock dialog methods - set it up after DOM creation
const dialog = dom.window.document.createElement('dialog');
Object.defineProperty(dom.window.HTMLDialogElement.prototype, 'showModal', {
  value: function() {
    this.open = true;
  }
});
Object.defineProperty(dom.window.HTMLDialogElement.prototype, 'close', {
  value: function() {
    this.open = false;
  }
});

// Set up timers
global.setInterval = function(fn, delay) {
  return dom.window.setInterval(fn, delay);
};

global.clearInterval = function(id) {
  try {
    return dom.window.clearInterval(id);
  } catch (e) {
    // Ignore errors from timer cleanup
  }
};