import assert from "assert";
import expect from "assert";
import { Storage } from "../src/storage.mjs";

describe("Array", function () {
  describe("#indexOf()", function () {
    it("should return -1 when the value is not present", function () {
      assert.equal([1, 2, 3].indexOf(4), -1);
    });
  });
});

describe("Storage", function () {
  describe("init", function () {
    it("not throw", function () {
      expect(function () {
        new Storage(new Object(), { listName: "tasks"})
      }, 'not to throw');
    });
  });
});