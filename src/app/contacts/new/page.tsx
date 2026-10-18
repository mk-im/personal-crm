import Link from "next/link";

import { ContactForm } from "@/components/contact-form";

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="w-fit text-ui-14 font-semibold text-label hover:text-ink">
        ← К списку
      </Link>
      <h1 className="text-lead font-medium lg:text-lead-lg">Новый контакт</h1>
      <ContactForm />
    </div>
  );
}
