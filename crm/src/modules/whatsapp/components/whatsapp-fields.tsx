"use client";
import { useState } from "react";
import { Field } from "@/components/forms/action-form";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useT } from "@/core/i18n/client";

/** Message fields that switch between free text and an approved template. */
export function WhatsAppFields() {
  const t = useT();
  const [mode, setMode] = useState<"text" | "template">("text");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field name="mode" label={t.whatsapp.mode}>
          <Select id="wa-mode" name="mode" value={mode} onChange={(e) => setMode(e.target.value as "text" | "template")}>
            <option value="text">{t.whatsapp.modeText}</option>
            <option value="template">{t.whatsapp.modeTemplate}</option>
          </Select>
        </Field>
      </div>
      {mode === "text" ? (
        <div className="sm:col-span-2">
          <Field name="message" label={t.whatsapp.message} required>
            <Textarea id="wa-message" name="message" rows={4} />
          </Field>
        </div>
      ) : (
        <>
          <Field name="templateName" label={t.whatsapp.templateName} required>
            <Input id="wa-template" name="templateName" dir="ltr" placeholder="order_update" />
          </Field>
          <Field name="templateLang" label={t.whatsapp.templateLang}>
            <Input id="wa-lang" name="templateLang" dir="ltr" defaultValue="en" />
          </Field>
          <div className="sm:col-span-2">
            <Field name="templateParams" label={t.whatsapp.templateParams}>
              <Textarea id="wa-params" name="templateParams" rows={3} />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
