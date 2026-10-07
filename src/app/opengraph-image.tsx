import { ImageResponse } from "next/og";

export const alt = "JomBit — Split the bill in seconds. Settle with DuitNow.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Image generation can't read CSS variables, so the DESIGN.md token values are repeated here.
const BG = "#151515";
const ACCENT = "#0CEAEC";
const MUTED = "#A0A0A0";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", background: BG, display: "flex", flexDirection: "column", justifyContent: "center", padding: 80 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "white", display: "flex" }}>
          Jom<span style={{ color: ACCENT }}>Bit</span>
        </div>
        <div style={{ fontSize: 58, fontWeight: 700, color: "white", marginTop: 30, lineHeight: 1.1 }}>Split the bill in seconds.</div>
        <div style={{ fontSize: 58, fontWeight: 700, color: ACCENT, lineHeight: 1.1 }}>Settle with DuitNow.</div>
        <div style={{ fontSize: 26, color: MUTED, marginTop: 40 }}>BFM3130 student proof of concept · not a licensed financial service</div>
      </div>
    ),
    size,
  );
}
