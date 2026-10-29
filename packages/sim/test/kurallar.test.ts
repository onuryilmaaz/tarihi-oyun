// Determinizm kuralları (ADR-0002): simülasyon kaynak kodunda yasaklı yapıların taranması.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const KAYNAK = join(import.meta.dirname, "..", "src");

const YASAK: [RegExp, string][] = [
  [/Math\.random/, "Math.random — tohumlu üreteç kullanın"],
  [/\bDate\b/, "Date — saat/tarih okuma yasak; oyun takvimi kullanın"],
  [/performance\./, "performance — zaman ölçümü simülasyonda yasak"],
  [/Math\.(sin|cos|tan|asin|acos|atan2?|sinh|cosh|tanh|exp|expm1|log|log1p|log2|log10|pow|cbrt|hypot)\b/,
    "tarayıcılar arası farklı sonuç verebilen matematik fonksiyonu"],
  [/\*\*/, "** üs alma — Math.pow ile aynı risk"],
  [/\bfetch\(|\bXMLHttpRequest\b|\bdocument\.|\bwindow\./, "dış dünya erişimi — çekirdek saf olmalı"],
  [/from\s+["']node:|\bprocess\./, "Node.js API — çekirdek tarayıcıda da çalışmalı (test tipleri yalnızca testler için)"],
];

describe("determinizm kuralları", () => {
  for (const ad of readdirSync(KAYNAK).filter((f) => f.endsWith(".ts"))) {
    it(`${ad} yasaklı yapı içermez`, () => {
      // Yorumlar taranmaz: blok yorumlar satır sayısı korunarak boşaltılır, satır yorumları silinir
      const metin = readFileSync(join(KAYNAK, ad), "utf8").replace(/\/\*[\s\S]*?\*\//g, (y) => y.replace(/[^\n]/g, " "));
      const satirlar = metin.split("\n");
      const ihlaller: string[] = [];
      satirlar.forEach((satir, i) => {
        const kod = satir.replace(/\/\/.*$/, "");
        for (const [re, neden] of YASAK) if (re.test(kod)) ihlaller.push(`${ad}:${i + 1} ${neden}`);
      });
      expect(ihlaller).toEqual([]);
    });
  }
});
