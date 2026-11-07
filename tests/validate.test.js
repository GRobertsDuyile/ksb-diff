// Tests for scripts/validate.js. Run with: node --test tests/
//
// Each failure test starts from the real ST0116 file and breaks one thing,
// so a passing test shows the validator catches that specific fault in data
// shaped like the real thing.

"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { validateAgainstSchema, checkConsistency } = require("../scripts/validate.js");

const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schema", "standard.schema.json"), "utf8"));
const ST0116_PATH = "data/ST0116/v1.2.json";

function loadSt0116() {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "..", ST0116_PATH), "utf8"));
}

function allErrors(data, relativePath = ST0116_PATH) {
  const schemaErrors = validateAgainstSchema(data, schema);
  return schemaErrors.length > 0 ? schemaErrors : checkConsistency(data, relativePath);
}

function assertOneErrorMatching(errors, pattern) {
  assert.ok(
    errors.some((message) => pattern.test(message)),
    `expected an error matching ${pattern}, got:\n${errors.join("\n") || "(no errors)"}`,
  );
}

test("the published ST0116 v1.2 file passes", () => {
  assert.deepEqual(allErrors(loadSt0116()), []);
});

test("a file without the optional source and grading fields still passes", () => {
  const data = loadSt0116();
  delete data.standard.sourceUrl;
  delete data.standard.checkedAgainstSource;
  delete data.gradingRules;
  assert.deepEqual(allErrors(data), []);
});

test("rejects a missing required field", () => {
  const data = loadSt0116();
  delete data.standard.title;
  assertOneErrorMatching(allErrors(data), /missing required field "title"/);
});

test("rejects an unexpected field", () => {
  const data = loadSt0116();
  data.methods[0].theme = "Communication";
  assertOneErrorMatching(allErrors(data), /unexpected field "theme"/);
});

test("rejects a wrong type", () => {
  const data = loadSt0116();
  data.standard.level = "4";
  assertOneErrorMatching(allErrors(data), /standard\.level: expected integer, found string/);
});

test("rejects a grade outside the enum", () => {
  const data = loadSt0116();
  data.methods[0].descriptors[0].grade = "excellent";
  assertOneErrorMatching(allErrors(data), /must be one of/);
});

test("rejects a badly formed KSB code", () => {
  const data = loadSt0116();
  data.ksbs.X1 = "not a real KSB";
  assertOneErrorMatching(allErrors(data), /X1 \(field name\)/);
});

test("rejects a check date that is not YYYY-MM-DD", () => {
  const data = loadSt0116();
  data.standard.checkedAgainstSource = "7 November 2026";
  assertOneErrorMatching(allErrors(data), /checkedAgainstSource/);
});

test("rejects a source link that is not https", () => {
  const data = loadSt0116();
  data.standard.sourceUrl.assessmentPlan = "http://example.org/plan.pdf";
  assertOneErrorMatching(allErrors(data), /sourceUrl\.assessmentPlan/);
});

test("rejects a schema keyword the validator does not implement", () => {
  const errors = validateAgainstSchema("text", { type: "string", maxLength: 3 });
  assertOneErrorMatching(errors, /unsupported keyword "maxLength"/);
});

test("rejects a descriptor KSB that does not exist", () => {
  const data = loadSt0116();
  data.methods[0].descriptors[0].ksbs = ["K99"];
  assertOneErrorMatching(allErrors(data), /M1-P01 lists K99, which is not in ksbs/);
});

test("rejects a descriptor KSB that belongs to the other method", () => {
  const data = loadSt0116();
  // K1 is assessed by the professional discussion (M2), not the project (M1).
  data.methods[0].descriptors[0].ksbs = ["K1"];
  assertOneErrorMatching(allErrors(data), /M1-P01 lists K1, which is not assessed by M1/);
});

test("rejects a descriptor identifier that does not match its grade", () => {
  const data = loadSt0116();
  data.methods[0].descriptors[0].grade = "distinction";
  assertOneErrorMatching(allErrors(data), /M1-P01 should start with M1-D/);
});

test("rejects a repeated descriptor identifier", () => {
  const data = loadSt0116();
  data.methods[0].descriptors[1].id = "M1-P01";
  assertOneErrorMatching(allErrors(data), /descriptor M1-P01 appears more than once/);
});

test("rejects grading rules that name a method not in the file", () => {
  const data = loadSt0116();
  data.gradingRules.methodGrades.M3 = ["Fail", "Pass"];
  assertOneErrorMatching(allErrors(data), /gradingRules refers to M3/);
});

test("rejects a file whose path does not match its metadata", () => {
  assertOneErrorMatching(allErrors(loadSt0116(), "data/ST0116/v1.1.json"), /should be at data\/ST0116\/v1\.2\.json/);
});
