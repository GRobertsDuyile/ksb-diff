#!/usr/bin/env node
// Validates every data file against schema/standard.schema.json, then runs the
// cross-checks a JSON Schema cannot express. Plain Node.js with no dependencies,
// so anyone can run it without installing anything.
//
// Usage: node scripts/validate.js
// Exits with code 1 if any file fails, so GitHub Actions marks the run as failed.

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.join(__dirname, "..");
const SCHEMA_PATH = path.join(REPO_ROOT, "schema", "standard.schema.json");
const DATA_DIR = path.join(REPO_ROOT, "data");

// Only the keywords this repository's schema uses are implemented. Any other
// keyword is reported as an error rather than ignored, so a schema change can
// never be silently unchecked.
const ASSERTION_KEYWORDS = new Set([
  "type",
  "required",
  "properties",
  "additionalProperties",
  "propertyNames",
  "items",
  "const",
  "enum",
  "pattern",
  "minLength",
  "minItems",
  "minimum",
  "maximum",
]);
const ANNOTATION_KEYWORDS = new Set(["$schema", "$id", "title", "description"]);

const GRADE_LETTERS = { pass: "P", merit: "M", distinction: "D" };

function typeOf(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Number.isInteger(value)) return "integer";
  return typeof value;
}

function matchesType(value, expected) {
  const actual = typeOf(value);
  // JSON Schema treats every integer as a number.
  return actual === expected || (expected === "number" && actual === "integer");
}

/**
 * Check a value against a schema, using only the keywords listed above.
 *
 * @param {*} value The value to check.
 * @param {object} schema The schema, or sub-schema, to check it against.
 * @param {string} where A readable location, such as "methods[0].descriptors[3]".
 * @returns {string[]} One message per problem found; empty if the value is valid.
 */
function validateAgainstSchema(value, schema, where = "(root)") {
  const errors = [];

  for (const keyword of Object.keys(schema)) {
    if (!ASSERTION_KEYWORDS.has(keyword) && !ANNOTATION_KEYWORDS.has(keyword)) {
      errors.push(`${where}: schema uses unsupported keyword "${keyword}"`);
    }
  }

  if ("type" in schema && !matchesType(value, schema.type)) {
    errors.push(`${where}: expected ${schema.type}, found ${typeOf(value)}`);
    // Every other keyword assumes the type is right, so stop here.
    return errors;
  }

  if ("const" in schema && value !== schema.const) {
    errors.push(`${where}: must equal ${JSON.stringify(schema.const)}`);
  }
  if ("enum" in schema && !schema.enum.includes(value)) {
    errors.push(`${where}: must be one of ${JSON.stringify(schema.enum)}, found ${JSON.stringify(value)}`);
  }

  if (typeof value === "string") {
    if ("minLength" in schema && value.length < schema.minLength) {
      errors.push(`${where}: must be at least ${schema.minLength} characters`);
    }
    if ("pattern" in schema && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${where}: "${value}" does not match ${schema.pattern}`);
    }
  }

  if (typeof value === "number") {
    if ("minimum" in schema && value < schema.minimum) {
      errors.push(`${where}: must be at least ${schema.minimum}`);
    }
    if ("maximum" in schema && value > schema.maximum) {
      errors.push(`${where}: must be at most ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if ("minItems" in schema && value.length < schema.minItems) {
      errors.push(`${where}: must have at least ${schema.minItems} items`);
    }
    if ("items" in schema) {
      value.forEach((item, i) => errors.push(...validateAgainstSchema(item, schema.items, `${where}[${i}]`)));
    }
  }

  if (typeOf(value) === "object") {
    for (const key of schema.required || []) {
      if (!(key in value)) errors.push(`${where}: missing required field "${key}"`);
    }
    const declared = schema.properties || {};
    for (const [key, child] of Object.entries(value)) {
      const childWhere = where === "(root)" ? key : `${where}.${key}`;
      if ("propertyNames" in schema) {
        errors.push(...validateAgainstSchema(key, schema.propertyNames, `${childWhere} (field name)`));
      }
      if (key in declared) {
        errors.push(...validateAgainstSchema(child, declared[key], childWhere));
      } else if (schema.additionalProperties === false) {
        errors.push(`${where}: unexpected field "${key}"`);
      } else if (typeOf(schema.additionalProperties) === "object") {
        errors.push(...validateAgainstSchema(child, schema.additionalProperties, childWhere));
      }
    }
  }

  return errors;
}

/**
 * Run the checks that depend on relationships between fields.
 *
 * @param {object} data A parsed data file that has already passed the schema.
 * @param {string} relativePath The file's path from the repository root, using "/".
 * @returns {string[]} One message per problem found; empty if the file is consistent.
 */
function checkConsistency(data, relativePath) {
  const errors = [];
  const { reference, standardVersion } = data.standard;

  // The path is how people and the comparison tool find a version, so it must
  // agree with the metadata inside the file.
  const expectedPath = `data/${reference}/v${standardVersion}.json`;
  if (relativePath !== expectedPath) {
    errors.push(`file should be at ${expectedPath} to match its reference and standardVersion`);
  }

  const methodIds = new Set();
  const descriptorIds = new Set();

  for (const method of data.methods) {
    if (methodIds.has(method.id)) errors.push(`method ${method.id} appears more than once`);
    methodIds.add(method.id);

    const methodKsbs = new Set(method.ksbs);
    for (const code of method.ksbs) {
      if (!(code in data.ksbs)) errors.push(`${method.id} lists ${code}, which is not in ksbs`);
    }

    for (const descriptor of method.descriptors) {
      if (descriptorIds.has(descriptor.id)) errors.push(`descriptor ${descriptor.id} appears more than once`);
      descriptorIds.add(descriptor.id);

      // Identifiers are assigned as M1-P01 and so on; a mismatch means a
      // descriptor was moved or regraded without being renumbered.
      const expectedPrefix = `${method.id}-${GRADE_LETTERS[descriptor.grade]}`;
      if (!descriptor.id.startsWith(expectedPrefix)) {
        errors.push(`${descriptor.id} should start with ${expectedPrefix} for a ${descriptor.grade} descriptor in ${method.id}`);
      }

      for (const code of descriptor.ksbs) {
        if (!(code in data.ksbs)) {
          errors.push(`${descriptor.id} lists ${code}, which is not in ksbs`);
        } else if (!methodKsbs.has(code)) {
          errors.push(`${descriptor.id} lists ${code}, which is not assessed by ${method.id}`);
        }
      }
    }
  }

  if (data.gradingRules) {
    const { methodGrades, methodCriteria, overallTable } = data.gradingRules;
    const referenced = [
      ...Object.keys(methodGrades),
      ...Object.keys(methodCriteria),
      ...overallTable.flatMap((row) => Object.keys(row).filter((key) => key !== "overall")),
    ];
    for (const id of new Set(referenced)) {
      if (!methodIds.has(id)) errors.push(`gradingRules refers to ${id}, which is not a method in this file`);
    }
  }

  return errors;
}

function findDataFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findDataFiles(fullPath);
    return entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

function main() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  const files = findDataFiles(DATA_DIR);
  let failedCount = 0;

  if (files.length === 0) {
    console.error("No data files found under data/.");
    process.exit(1);
  }

  for (const file of files) {
    const relativePath = path.relative(REPO_ROOT, file).split(path.sep).join("/");
    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      console.error(`FAIL ${relativePath}\n  not valid JSON: ${error.message}`);
      failedCount += 1;
      continue;
    }

    const schemaErrors = validateAgainstSchema(data, schema);
    // The consistency checks assume the shape the schema guarantees.
    const errors = schemaErrors.length > 0 ? schemaErrors : checkConsistency(data, relativePath);

    if (errors.length > 0) {
      console.error(`FAIL ${relativePath}\n${errors.map((message) => `  ${message}`).join("\n")}`);
      failedCount += 1;
    } else {
      console.log(`ok   ${relativePath}`);
    }
  }

  console.log(`\n${files.length - failedCount} of ${files.length} data files valid.`);
  if (failedCount > 0) process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { validateAgainstSchema, checkConsistency };
