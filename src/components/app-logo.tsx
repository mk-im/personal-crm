import Link from "next/link";

export function AppLogo() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2 rounded-full border border-white/28 bg-white/16 px-5 py-2.5 text-ui-14 font-semibold text-white backdrop-blur-md lg:gap-2.5 lg:px-6 lg:py-3 lg:text-ui-16"
    >
      <span className="relative block size-4.5 rounded-r6 bg-white lg:size-5.5 lg:rounded-r7" aria-hidden="true">
        <span className="absolute inset-1.25 rounded-full bg-blue-1 lg:inset-1.5" />
      </span>
      Личная CRM
    </Link>
  );
}
