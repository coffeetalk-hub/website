"use client";
import { useT } from "@/core/i18n/client";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Nav } from "./nav";

export function MobileNav({ keys }: { keys: string[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t.nav.menu}>
          <Menu className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent title={t.app.name} className="border-0 bg-sidebar text-sidebar-foreground">
        <Nav keys={keys} onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
