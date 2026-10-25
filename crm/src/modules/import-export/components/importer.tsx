"use client";
import { useState, useTransition } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/core/i18n/client";
import { importRows, type ImportResult } from "../actions";
import type { CsvEntity, CsvField } from "../fields";

/** Keeps Latin and Arabic letters/digits so Arabic headers can be matched too. */
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");

/** Pick the CSV column whose header matches a field's label, key or alias. */
function autoMap(headers: string[], fields: CsvField[]) {
  const map: Record<string, string> = {};
  for (const f of fields) {
    const names = [f.label, f.key.replace(/^cf:/, ""), ...f.aliases].map(norm).filter(Boolean);
    const h = headers.find((x) => names.includes(norm(x)));
    if (h) map[f.key] = h;
  }
  return map;
}

export function Importer({ fieldsByEntity }: { fieldsByEntity: Record<CsvEntity, CsvField[]> }) {
  const t = useT();
  const [entity, setEntity] = useState<CsvEntity>("CONTACT");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fields = fieldsByEntity[entity];

  function onFile(file: File | undefined) {
    setResult(null);
    setParseError(null);
    if (!file) return;
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const hs = res.meta.fields ?? [];
        if (!hs.length || !res.data.length) return setParseError(t.importExport.noDataRows);
        setRows(res.data);
        setHeaders(hs);
        setMapping(autoMap(hs, fields));
      },
      error: (e) => setParseError(e.message),
    });
  }

  function changeEntity(e: CsvEntity) {
    setEntity(e);
    setMapping(autoMap(headers, fieldsByEntity[e]));
    setResult(null);
  }

  const missing = fields.filter((f) => f.required && !mapping[f.key]);
  const mapped = rows.map((r) => Object.fromEntries(fields.filter((f) => mapping[f.key]).map((f) => [f.key, r[mapping[f.key]] ?? ""])));

  function run() {
    start(async () => setResult(await importRows(entity, mapped)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t.importExport.importTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">{t.importExport.importHelp}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={entity} onChange={(e) => changeEntity(e.target.value as CsvEntity)} aria-label={t.importExport.importType} className="w-40">
            <option value="CONTACT">{t.nav.contacts}</option>
            <option value="COMPANY">{t.nav.companies}</option>
          </Select>
          <input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} aria-label={t.importExport.csvFile} className="text-sm file:me-3 file:rounded-xl file:border-0 file:bg-secondary file:px-4 file:py-2 file:text-sm file:font-medium" />
        </div>
        {parseError && <p className="text-sm text-destructive">{parseError}</p>}

        {rows.length > 0 && (
          <>
            <p className="text-sm">
              {t.tpl(t.importExport.matchColumns, { file: fileName, rows: rows.length })}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {fields.map((f) => (
                <label key={f.key} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </span>
                  <Select value={mapping[f.key] ?? ""} onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })} className="w-48">
                    <option value="">{t.importExport.skip}</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                </label>
              ))}
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-xs">
                <thead className="bg-secondary">
                  <tr>
                    {fields.filter((f) => mapping[f.key]).map((f) => (
                      <th key={f.key} className="px-2 py-1.5 text-start font-medium">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mapped.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-t">
                      {fields.filter((f) => mapping[f.key]).map((f) => (
                        <td key={f.key} className="px-2 py-1.5">
                          {r[f.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">{t.importExport.preview}</p>

            {missing.length > 0 && <p className="text-sm text-destructive">{t.tpl(t.importExport.mapRequired, { fields: missing.map((m) => m.label).join(t.locale === "ar" ? "، " : ", ") })}</p>}
            <Button onClick={run} disabled={pending || missing.length > 0}>
              {pending ? t.importExport.importing : t.tpl(t.importExport.importRows, { n: rows.length })}
            </Button>
          </>
        )}

        {result && (
          <div className="rounded-xl bg-secondary p-3 text-sm">
            {result.fatal ? (
              <p className="text-destructive">{result.fatal}</p>
            ) : (
              <>
                <p className="font-medium">
                  {t.tpl(t.importExport.result, { created: result.created, skipped: result.skipped, errors: result.errors.length - result.skipped })}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 max-h-48 list-disc space-y-0.5 overflow-y-auto ps-5 text-xs text-muted-foreground">
                    {result.errors.slice(0, 100).map((e, i) => (
                      <li key={i}>
                        {t.tpl(t.importExport.rowError, { row: e.row, message: e.message })}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
