import Link from "next/link";
import { Suspense } from "react";

import { GroupsManager } from "@/components/groups-manager";
import { listGroups } from "@/db/queries";
import { requireUserId } from "@/lib/session";

async function GroupsContent() {
  const groups = await listGroups(await requireUserId());

  return (
    <div className="flex flex-col gap-6">
      <Link href="/" className="w-fit text-ui-14 font-semibold text-label hover:text-ink">
        ← К списку
      </Link>
      <h1 className="text-lead font-medium lg:text-lead-lg">Группы</h1>
      <GroupsManager groups={groups} />
    </div>
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка групп…</p>}>
      <GroupsContent />
    </Suspense>
  );
}
