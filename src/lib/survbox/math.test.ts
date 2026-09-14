import assert from "node:assert/strict";
import { test } from "node:test";
import {
  speedOfSound,
  wetBulbC,
  windChillF,
  popEst,
  naismithHours,
  dewpointC,
  mifflinBmr,
  calorieNeed,
  weatherKcalFactor,
  hangGeometry,
  paceDistance,
  gradeFromPitch,
  riseRunM,
} from "./math.ts";

test("sound speed at 20C", () => {
  assert.ok(Math.abs(speedOfSound(20) - 343.2) < 0.2);
});

test("wet bulb 20C 50%", () => {
  assert.ok(Math.abs(wetBulbC(20, 50) - 13.7) < 0.15);
});

test("wind chill 0F 15mph", () => {
  assert.ok(Math.abs(windChillF(0, 15) + 19.4) < 0.3);
});

test("naismith 9mi 3000ft", () => {
  assert.equal(
    naismithHours({ imperial: true, dist: 9, climb: 3000, packLb: 0, terrain: 1 }),
    4.5,
  );
});

test("dewpoint 20C 50% is cooler", () => {
  const td = dewpointC(20, 50);
  assert.ok(td < 20 && td > 8);
});

test("pop wet air high", () => {
  const p = popEst(20, 19, 90, -1);
  assert.ok(p >= 70);
});

test("mifflin male 90.7kg 177.8cm age 27", () => {
  const b = mifflinBmr(90.7, 177.8, 27, true);
  assert.ok(Math.abs(b - 1888) < 3);
});

test("calorie camp day no miles is pal times bmr", () => {
  const out = calorieNeed({
    kg: 90.7,
    cm: 177.8,
    age: 27,
    male: true,
    work: "light",
    tF: 70,
    rh: 50,
    distKm: 0,
    gainM: 0,
  });
  assert.equal(out.walk, 0);
  assert.equal(out.weather, 0);
  assert.ok(out.total > 2500 && out.total < 2800);
});

test("calorie hike adds walk and climb", () => {
  const out = calorieNeed({
    kg: 90.7,
    cm: 177.8,
    age: 27,
    male: true,
    work: "medium",
    tF: 70,
    rh: 50,
    distKm: 12.87,
    gainM: 304.8,
  });
  assert.ok(out.walk > 900 && out.walk < 1200);
  assert.ok(out.total > 3800 && out.total < 4300);
});

test("cold weather adds a BMR tax", () => {
  assert.ok(weatherKcalFactor(20, 50) > 0.1);
  assert.equal(weatherKcalFactor(70, 50), 0);
});

test("pace 62 per 100m and 310 walked is 500m", () => {
  assert.ok(Math.abs(paceDistance(310, 62) - 500) < 0.01);
});

test("hang 12 ft branch fails the 6 ft below-limb rule", () => {
  const low = hangGeometry(20, 12, true);
  assert.equal(low.ok, false);
  const ok = hangGeometry(20, 20, true);
  assert.equal(ok.ok, true);
  assert.equal(ok.rope, 20 + 40 + 10);
});

test("pitch 45 is 100 percent grade", () => {
  const g = gradeFromPitch(45);
  assert.ok(Math.abs(g.grade - 100) < 0.01);
  assert.equal(g.angle, 45);
});

test("two GPS marks give run and rise", () => {
  const a = { lat: 39.42, lon: -81.45, altM: 200 };
  const b = { lat: 39.43, lon: -81.45, altM: 250 };
  const rr = riseRunM(a, b);
  assert.ok(rr.runM > 1000 && rr.runM < 1200);
  assert.equal(rr.riseM, 50);
});
