import Link from "next/link";

import { cn } from "cn";

export function CtaLink({
  href,
  children,
  icon = "↗",
  className,
}: {
  href: string;
  children: string;
  icon?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3.5 rounded-r14 bg-black py-1.5 pr-1.5 pl-6 text-btn font-semibold text-white no-underline transition-colors hover:bg-black-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-sky lg:gap-4 lg:rounded-r16 lg:py-2 lg:pr-2 lg:pl-7 lg:text-btn-lg",
        className,
      )}
    >
      {children}
      <span
        className="grid size-10.5 place-items-center rounded-r10 bg-white text-ui-18 text-black transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 lg:size-12.5 lg:rounded-r12 lg:text-ui-20"
        aria-hidden="true"
      >
        {icon}
      </span>
    </Link>
  );
}
