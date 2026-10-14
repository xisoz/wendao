import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildChart, defaultMinute, HOURS } from "./bazi.ts";

// Expected pillars were read from lunar-javascript directly
// (Solar.fromYmdHms(...).getLunar().getEightChar()), not hand-derived.
const gz = (c: ReturnType<typeof buildChart>) => c.pillars.map((p) => `${p.gan}${p.zhi}`);
const base = { gender: null, flowYear: 2026 } as const;

describe("buildChart", () => {
  it("晚子时 23:30 keeps the same day pillar and uses the next day's 子 stem (甲子)", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 23 });
    assert.deepEqual(gz(c), ["甲辰", "丁卯", "癸酉", "甲子"]);
  });

  it("早子时 00:30 on the same date gives 壬子", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 0 });
    assert.deepEqual(gz(c), ["甲辰", "丁卯", "癸酉", "壬子"]);
  });

  it("惊蛰 2024-03-05 10:22:45 switches the month pillar 丙寅 → 丁卯", () => {
    const before = buildChart({ ...base, year: 2024, month: 3, day: 5, hour: 8, minute: 30 }); // 08:30
    const after = buildChart({ ...base, year: 2024, month: 3, day: 5, hour: 10, minute: 30 }); // 10:30
    assert.deepEqual(gz(before), ["甲辰", "丙寅", "戊辰", "丙辰"]);
    assert.deepEqual(gz(after), ["甲辰", "丁卯", "戊辰", "丁巳"]);
    assert.equal(before.monthZhi, "寅");
    assert.equal(after.monthZhi, "卯");
  });

  it("闰二月 date (2023-04-10) resolves to the solar-term month 丙辰", () => {
    const c = buildChart({ ...base, year: 2023, month: 4, day: 10, hour: 12 });
    assert.deepEqual(gz(c), ["癸卯", "丙辰", "戊戌", "戊午"]);
    assert.match(c.lunar, /闰二月/);
  });

  it("unknown hour leaves the hour pillar out of the counts", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: null });
    assert.equal(c.hourKnown, false);
    assert.equal(c.pillars[3]?.known, false);
    assert.deepEqual(gz(c).slice(0, 3), ["甲辰", "丁卯", "癸酉"]);
    const total = Object.values(c.counts).reduce((a, b) => a + b, 0);
    // year 1+1, month 1.25+1.7, day 1+1 — no hour pillar weight
    assert.equal(Math.round(total * 100) / 100, 6.95);
    assert.match(c.summary, /时辰未定/);
  });
});

describe("HOURS", () => {
  it("covers 早子 at 0 and 晚子 at 23", () => {
    assert.equal(HOURS[0]?.id, "0");
    assert.equal(HOURS.at(-1)?.id, "23");
    assert.equal(HOURS.length, 13);
  });
});

describe("minute precision", () => {
  it("立春 2024-02-04（lunar-javascript 取 16:27:07）：16:26 仍是癸卯年乙丑月，16:28 换甲辰年丙寅月", () => {
    const before = buildChart({ ...base, year: 2024, month: 2, day: 4, hour: 16, minute: 26 });
    const after = buildChart({ ...base, year: 2024, month: 2, day: 4, hour: 16, minute: 28 });
    assert.deepEqual(gz(before).slice(0, 2), ["癸卯", "乙丑"]);
    assert.deepEqual(gz(after).slice(0, 2), ["甲辰", "丙寅"]);
    assert.equal(before.solarTime, "2024-02-04 16:26");
  });

  it("未填分钟取时辰中点：偶数整点为 :00，早子/晚子为 :30", () => {
    assert.equal(defaultMinute(10), 0);
    assert.equal(defaultMinute(0), 30);
    assert.equal(defaultMinute(23), 30);
    assert.equal(buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10 }).solarTime, "2024-03-10 10:00");
  });

  it("非法分钟回落到中点", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10, minute: 75 });
    assert.equal(c.solarTime, "2024-03-10 10:00");
  });
});

describe("真太阳时", () => {
  it("不填经度不校正", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10, minute: 0 });
    assert.equal(c.longitude, null);
    assert.equal(c.trueSolarOffset, 0);
    assert.equal(c.trueSolarTime, c.solarTime);
  });

  it("东经 120° 只差均时差（3 月约 -10 分钟）", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10, minute: 0, longitude: 120 });
    assert.ok(c.trueSolarOffset <= -8 && c.trueSolarOffset >= -12, String(c.trueSolarOffset));
  });

  it("乌鲁木齐 87.6°E 10:00 校正约 -140 分钟，时柱由巳变辰", () => {
    const std = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10, minute: 0 });
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 10, minute: 0, longitude: 87.6 });
    assert.ok(c.trueSolarOffset <= -135 && c.trueSolarOffset >= -145, String(c.trueSolarOffset));
    assert.equal(std.pillars[3]?.zhi, "巳");
    assert.equal(c.pillars[3]?.zhi, "辰");
    assert.equal(c.trueSolarTime.slice(0, 13), "2024-03-10 07");
  });

  it("校正可跨过节气：立春后 5 分钟出生、经度偏西，按真太阳时仍在立春前", () => {
    const c = buildChart({ ...base, year: 2024, month: 2, day: 4, hour: 16, minute: 32, longitude: 110 });
    assert.deepEqual(gz(c).slice(0, 2), ["癸卯", "乙丑"]);
  });
});

describe("神煞", () => {
  const find = (c: ReturnType<typeof buildChart>, name: string) => c.shenSha.find((s) => s.name === name);

  it("2024-03-10 晚子（癸日、辰年）按口诀起各星", () => {
    const c = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 23 });
    assert.deepEqual(find(c, "天乙贵人")?.branches, ["卯", "巳"]);
    assert.deepEqual(find(c, "天乙贵人")?.hits, ["卯"]);
    assert.deepEqual(find(c, "文昌")?.branches, ["卯"]);
    assert.deepEqual(find(c, "禄神")?.branches, ["子"]);
    assert.deepEqual(find(c, "禄神")?.hits, ["子"]);
    assert.deepEqual(find(c, "羊刃")?.branches, ["丑"]);
    assert.deepEqual(find(c, "桃花")?.branches, ["酉"]);
    assert.deepEqual(find(c, "桃花")?.hits, ["酉"]);
    assert.deepEqual(find(c, "驿马")?.branches, ["寅"]);
    assert.deepEqual(find(c, "驿马")?.hits, []);
    assert.deepEqual(find(c, "华盖")?.branches, ["辰"]);
    assert.deepEqual(find(c, "华盖")?.hits, ["辰"]);
    assert.equal(c.shenSha.length, 8);
  });

  it("时辰未知时不拿时支去命中", () => {
    const known = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: 23 });
    const unknown = buildChart({ ...base, year: 2024, month: 3, day: 10, hour: null });
    assert.deepEqual(find(known, "禄神")?.hits, ["子"]);
    assert.deepEqual(find(unknown, "禄神")?.hits, []);
  });
});
