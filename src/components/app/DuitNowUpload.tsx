"use client";

import { useRef, useState } from "react";
import jsQR from "jsqr";
import { ImageUp } from "lucide-react";
import { makeDemoPayload, validatePayload, type ValidationResult } from "@/lib/duitnow";
import { Button, Notice } from "@/components/ui";

async function decodeImage(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not open that image."));
      i.src = url;
    });
    // Try a few sizes — large phone photos decode better when scaled down.
    for (const max of [1200, 800, 1600, 500]) {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const code = jsQR(data.data, w, h, { inversionAttempts: "attemptBoth" });
      if (code?.data) return code.data;
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Upload a DuitNow QR image → decode in the browser with jsQR → validate the
 * EMVCo payload (TLV + CRC) → hand the text payload to `onSave`.
 */
export function DuitNowUpload({
  displayName,
  onSave,
  demoAccountId = "9999",
}: {
  displayName: string;
  onSave: (payload: string, merchantName: string | null) => void;
  demoAccountId?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const accept = (payload: string) => {
    const res = validatePayload(payload);
    setResult(res);
    if (!res.ok) {
      setError(res.errors.join(" "));
      return;
    }
    setError(null);
    onSave(payload.trim(), res.merchantName ?? null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const text = await decodeImage(file);
      if (!text) setError("We couldn't find a QR code in that image. Try a clearer screenshot of your DuitNow QR.");
      else accept(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <input ref={input} type="file" accept="image/*" className="sr-only" id="duitnow-file" onChange={(e) => onFile(e.target.files?.[0])} />
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => input.current?.click()} disabled={busy}>
          <ImageUp size={18} aria-hidden /> {busy ? "Reading…" : "Upload QR image"}
        </Button>
        <Button variant="ghost" onClick={() => accept(makeDemoPayload(`${displayName} (Demo)`, demoAccountId))}>
          Use demo test QR
        </Button>
      </div>
      <p className="text-[12px] text-muted">
        Save a screenshot of your bank app&apos;s &ldquo;Receive via DuitNow QR&rdquo; screen and upload it. The QR is decoded on your phone; only the text payload is stored.
      </p>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {result?.ok && result.warnings.length ? <Notice tone="warning">{result.warnings.join(" ")}</Notice> : null}
      {result?.ok && !result.warnings.length ? <Notice tone="success">Valid DuitNow QR saved{result.merchantName ? ` for ${result.merchantName}` : ""}.</Notice> : null}
    </div>
  );
}
