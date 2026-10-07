import { describe, expect, it } from "vitest";
import { buildDynamicPayload, crc16, makeDemoPayload, parseTlv, serializeTlv, validatePayload } from "./index";

describe("CRC-16/CCITT-FALSE", () => {
  it("matches the published check value for '123456789'", () => {
    expect(crc16("123456789")).toBe("29B1");
  });

  it("matches an independently computed EMVCo payload checksum", () => {
    // Reference value computed with Python's binascii.crc_hqx(data, 0xFFFF),
    // which implements the same CRC-16/CCITT-FALSE used by EMVCo QR codes.
    const body = "00020101021153037025802SG5911JomBit Test6009Singapore6304";
    expect(crc16(body)).toBe("211E");
    expect(validatePayload(body + "211E").errors).toEqual([]);
  });

  it("returns FFFF for empty input (initial value)", () => {
    expect(crc16("")).toBe("FFFF");
  });
});

describe("TLV", () => {
  const payload = makeDemoPayload("Aiman Test", "0001");

  it("parse / serialise round-trip", () => {
    const fields = parseTlv(payload);
    expect(serializeTlv(fields)).toBe(payload);
    expect(fields[0]).toEqual({ tag: "00", value: "01" });
  });

  it("rejects truncated input", () => {
    expect(() => parseTlv("000201015")).toThrow();
  });

  it("demo payload validates and is detected as DuitNow", () => {
    const res = validatePayload(payload);
    expect(res.ok).toBe(true);
    expect(res.isDuitNow).toBe(true);
    expect(res.merchantName).toBe("AIMAN TEST");
  });

  it("detects a broken CRC", () => {
    const broken = payload.slice(0, -4) + (payload.endsWith("0000") ? "1111" : "0000");
    expect(validatePayload(broken).ok).toBe(false);
  });

  it("warns (but does not fail) when no DuitNow identifier exists", () => {
    const body = "000201010211" + "5303458" + "5802MY" + "5904SHOP" + "6304";
    const res = validatePayload(body + crc16(body));
    expect(res.ok).toBe(true);
    expect(res.warnings.length).toBe(1);
  });
});

describe("dynamic QR with amount", () => {
  const saved = makeDemoPayload("Mei Ling Test", "0002");

  it("inserts amount, sets dynamic flag and produces a valid CRC", () => {
    const dyn = buildDynamicPayload(saved, "12.50");
    const res = validatePayload(dyn);
    expect(res.ok).toBe(true);
    const fields = parseTlv(dyn);
    expect(fields.find((f) => f.tag === "01")?.value).toBe("12");
    expect(fields.find((f) => f.tag === "53")?.value).toBe("458");
    expect(fields.find((f) => f.tag === "54")?.value).toBe("12.50");
    expect(fields[fields.length - 1].tag).toBe("63");
    // tag order is ascending
    const tags = fields.map((f) => Number(f.tag));
    expect([...tags].sort((a, b) => a - b)).toEqual(tags);
    expect(dyn.endsWith(crc16(dyn.slice(0, -4)))).toBe(true);
  });

  it("replaces an existing amount instead of duplicating it", () => {
    const once = buildDynamicPayload(saved, "1.00");
    const twice = buildDynamicPayload(once, "99.90");
    const fields = parseTlv(twice);
    expect(fields.filter((f) => f.tag === "54")).toEqual([{ tag: "54", value: "99.90" }]);
    expect(validatePayload(twice).ok).toBe(true);
  });

  it("rejects badly formatted amounts", () => {
    expect(() => buildDynamicPayload(saved, "12.5")).toThrow();
  });
});
