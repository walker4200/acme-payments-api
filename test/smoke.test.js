const assert = require("assert");
const _ = require("lodash");

describe("smoke", () => {
  it("merges preferences with defaults", () => {
    assert.deepStrictEqual(_.merge({}, { theme: "light" }, { currency: "USD" }), { theme: "light", currency: "USD" });
  });
});
