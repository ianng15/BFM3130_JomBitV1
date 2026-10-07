/**
 * Receipt parsing. In this demo build only the mock parser (bundled sample
 * receipts) is active — no AI key needed. A Gemini / Google Vision parser can
 * implement the same `ReceiptParser` interface later.
 */

export interface ParsedReceiptItem {
  name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

/** Shape returned by every parser (matches SPEC.md §4.1). */
export interface ParsedReceipt {
  merchant: string;
  date: string;
  currency: string;
  items: ParsedReceiptItem[];
  subtotal: number;
  service_charge: number;
  sst: number;
  rounding: number;
  total: number;
  confidence: "high" | "medium" | "low";
}

export interface ReceiptParser {
  name: "gemini" | "vision" | "mock";
  parse(input: { sampleId?: string; image?: Blob }): Promise<ParsedReceipt>;
}

export interface SampleReceipt {
  id: string;
  label: string;
  blurb: string;
  receipt: ParsedReceipt;
}

/** Three fictional Malaysian sample receipts. Totals add up exactly. */
export const SAMPLE_RECEIPTS: SampleReceipt[] = [
  {
    id: "mamak",
    label: "Mamak supper",
    blurb: "Roti, nasi kandar & teh tarik — no service charge",
    receipt: {
      merchant: "Restoran Nasi Kandar Bistari (sample)",
      date: "2026-10-02",
      currency: "MYR",
      items: [
        { name: "Roti Canai", quantity: 4, unit_price: 1.8, line_total: 7.2 },
        { name: "Nasi Kandar Ayam", quantity: 2, unit_price: 12.5, line_total: 25.0 },
        { name: "Teh Tarik", quantity: 3, unit_price: 2.8, line_total: 8.4 },
        { name: "Milo Ais", quantity: 1, unit_price: 3.5, line_total: 3.5 },
        { name: "Maggi Goreng", quantity: 1, unit_price: 8.0, line_total: 8.0 },
      ],
      subtotal: 52.1,
      service_charge: 0,
      sst: 0,
      rounding: 0,
      total: 52.1,
      confidence: "high",
    },
  },
  {
    id: "cafe",
    label: "Café brunch",
    blurb: "10% service charge + 6% SST + rounding",
    receipt: {
      merchant: "Kopi Kawan Café (sample)",
      date: "2026-10-05",
      currency: "MYR",
      items: [
        { name: "Flat White", quantity: 2, unit_price: 13.0, line_total: 26.0 },
        { name: "Iced Matcha Latte", quantity: 1, unit_price: 15.0, line_total: 15.0 },
        { name: "Nasi Lemak Rendang", quantity: 1, unit_price: 22.9, line_total: 22.9 },
        { name: "Butter Croissant", quantity: 1, unit_price: 9.5, line_total: 9.5 },
        { name: "Burnt Cheesecake", quantity: 1, unit_price: 14.0, line_total: 14.0 },
      ],
      subtotal: 87.4,
      service_charge: 8.74,
      sst: 5.77,
      rounding: -0.01,
      total: 101.9,
      confidence: "high",
    },
  },
  {
    id: "dinner",
    label: "Seafood group dinner",
    blurb: "Big shared dishes for 4+, service charge + SST",
    receipt: {
      merchant: "Restoran Seafood Teluk (sample)",
      date: "2026-10-06",
      currency: "MYR",
      items: [
        { name: "Ikan Bakar", quantity: 1, unit_price: 68.0, line_total: 68.0 },
        { name: "Sotong Goreng Tepung", quantity: 1, unit_price: 32.0, line_total: 32.0 },
        { name: "Kangkung Belacan", quantity: 2, unit_price: 14.0, line_total: 28.0 },
        { name: "Nasi Putih", quantity: 6, unit_price: 2.0, line_total: 12.0 },
        { name: "Udang Butter", quantity: 1, unit_price: 45.0, line_total: 45.0 },
        { name: "Air Limau", quantity: 6, unit_price: 4.5, line_total: 27.0 },
      ],
      subtotal: 212.0,
      service_charge: 21.2,
      sst: 13.99,
      rounding: 0.01,
      total: 247.2,
      confidence: "medium",
    },
  },
];

export const mockParser: ReceiptParser = {
  name: "mock",
  async parse({ sampleId }) {
    const sample = SAMPLE_RECEIPTS.find((s) => s.id === sampleId);
    if (!sample) throw new Error("No AI receipt reader is configured in demo mode. Pick a sample receipt or enter items manually.");
    return structuredClone(sample.receipt);
  },
};
