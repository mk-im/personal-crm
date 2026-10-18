import { CtaLink } from "@/components/cta-link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-start gap-5 rounded-r22 bg-white p-6 shadow-card lg:rounded-r26 lg:shadow-card-lg">
      <h1 className="text-lead font-medium lg:text-lead-lg">Контакт не найден</h1>
      <CtaLink href="/">К списку</CtaLink>
    </div>
  );
}
