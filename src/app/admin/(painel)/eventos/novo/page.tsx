import type { Metadata } from "next";

import { FormEvento } from "@/components/admin/form-evento";
import { exigirAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Novo evento — Admin" };

export default async function NovoEventoPage() {
  await exigirAdmin();

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Novo evento</h1>
      <p className="mt-2 text-muted-foreground">
        O evento nasce como rascunho — publique quando estiver pronto.
      </p>
      <div className="mt-8">
        <FormEvento />
      </div>
    </div>
  );
}
