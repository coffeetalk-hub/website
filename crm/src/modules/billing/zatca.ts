import QRCode from "qrcode";

/**
 * ZATCA (Saudi e-invoicing) Phase 1 QR code: a base64 TLV payload with
 * 1 seller name · 2 VAT registration number · 3 timestamp (ISO 8601) · 4 total incl. VAT · 5 VAT amount.
 * This is the simplified-invoice QR. Phase 2 (XML, cryptographic stamp, clearance/reporting) is NOT implemented.
 */
export function zatcaTlv(f: { sellerName: string; vatNumber: string; timestamp: Date; total: number; vat: number }) {
  const field = (tag: number, value: string) => {
    const v = Buffer.from(value, "utf8");
    if (v.length > 255) throw new Error("ZATCA TLV field too long");
    return Buffer.concat([Buffer.from([tag, v.length]), v]);
  };
  const iso = f.timestamp.toISOString().replace(/\.\d{3}Z$/, "Z");
  return Buffer.concat([
    field(1, f.sellerName),
    field(2, f.vatNumber),
    field(3, iso),
    field(4, f.total.toFixed(2)),
    field(5, f.vat.toFixed(2)),
  ]).toString("base64");
}

export async function qrSvg(payload: string) {
  return QRCode.toString(payload, { type: "svg", margin: 1, width: 160, errorCorrectionLevel: "M" });
}

/** Decode a TLV payload back into its fields (used by tests and for verification). */
export function decodeTlv(b64: string) {
  const buf = Buffer.from(b64, "base64");
  const out: Record<number, string> = {};
  for (let i = 0; i < buf.length; ) {
    const tag = buf[i];
    const len = buf[i + 1];
    out[tag] = buf.subarray(i + 2, i + 2 + len).toString("utf8");
    i += 2 + len;
  }
  return out;
}
