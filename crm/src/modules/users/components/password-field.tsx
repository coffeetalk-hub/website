"use client";
import { useState } from "react";
import { Eye, EyeOff, Wand2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useT } from "@/core/i18n/client";

/** Unambiguous characters only (no 0/O, 1/l/I) so a temporary password can be read out or typed easily. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generate(length = 14) {
  const buf = new Uint32Array(length);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

export function PasswordField({ required }: { required?: boolean }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [generated, setGenerated] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <Input id="password" name="password" type={visible ? "text" : "password"} autoComplete="new-password" required={required} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.auth.hide : t.auth.show}
          title={visible ? t.auth.hide : t.auth.show}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border hover:bg-accent"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={() => {
            const input = document.getElementById("password") as HTMLInputElement;
            // set through the native setter so React-controlled/uncontrolled forms both see the value
            input.value = generate();
            setVisible(true);
            setGenerated(true);
          }}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm hover:bg-accent"
        >
          <Wand2 className="h-4 w-4 text-coral" />
          {t.auth.generate}
        </button>
      </div>
      {generated && <p className="text-xs text-muted-foreground">{t.auth.passwordSetHint}</p>}
    </div>
  );
}
