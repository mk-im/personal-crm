import Link from "next/link";

import { GROUPS_PAGE } from "@/lib/groups";
import { getSessionUser } from "@/lib/session";
import { signOut } from "@/server/sign-in";

const linkClass = "text-ui-14 font-semibold text-white hover:text-white/80 lg:text-ui-16";

// Shown only with a session: the signed-in email and a way out.
export async function SessionHeader() {
  const user = await getSessionUser();

  if (!user) {
    return null;
  }

  return (
    <nav aria-label="Аккаунт" className="flex min-w-0 items-center gap-4 lg:gap-6">
      <Link href={GROUPS_PAGE.href} className={linkClass}>
        {GROUPS_PAGE.label}
      </Link>
      <span className="truncate text-ui-14 text-white/80 lg:text-ui-16">{user.email}</span>
      <form action={signOut}>
        <button type="submit" className={linkClass}>
          Выйти
        </button>
      </form>
    </nav>
  );
}
