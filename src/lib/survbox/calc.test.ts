import assert from "node:assert/strict";
import { test } from "node:test";
import { evalCalc, fmtCalc } from "./calc.ts";

test("sin 30 deg is 0.5", () => {
  const r = evalCalc("sin(30)", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(Math.abs(r.value - 0.5) < 1e-10);
});

test("cos 0 is 1", () => {
  const r = evalCalc("cos(0)", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, 1);
});

test("sqrt 2 squared is 2", () => {
  const r = evalCalc("sqrt(2)^2", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(Math.abs(r.value - 2) < 1e-10);
});

test("2 pi implicit multiply", () => {
  const r = evalCalc("2pi", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(Math.abs(r.value - 2 * Math.PI) < 1e-10);
});

test("power is right assoc", () => {
  const r = evalCalc("2^3^2", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, 512);
});

test("unary minus", () => {
  const r = evalCalc("-3+5", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, 2);
});

test("asin 0.5 is 30 deg", () => {
  const r = evalCalc("asin(0.5)", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.ok(Math.abs(r.value - 30) < 1e-8);
});

test("ans reuse", () => {
  const r = evalCalc("ans*2", true, 21);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, 42);
});

test("log 100 is 2", () => {
  const r = evalCalc("log(100)", true);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.value, 2);
});

test("bad paren", () => {
  const r = evalCalc("sin(30", true);
  assert.equal(r.ok, false);
});

test("fmt small", () => {
  assert.equal(fmtCalc(2), "2");
});
