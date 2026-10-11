import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Контакт не найден</h1>
      <Link href="/" className={buttonVariants()}>
        К списку
      </Link>
    </div>
  );
}
