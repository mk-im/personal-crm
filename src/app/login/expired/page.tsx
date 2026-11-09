import { CtaLink } from "@/components/cta-link";

export default function ExpiredLinkPage() {
  return (
    <div className="flex flex-col items-start gap-5 rounded-r22 bg-white p-6 shadow-card lg:rounded-r26 lg:shadow-card-lg">
      <h1 className="text-lead font-medium lg:text-lead-lg">Ссылка устарела, запроси новую</h1>
      <p className="text-ui-14 text-muted lg:text-ui-16">
        Ссылка работает 15 минут и открывается один раз.
      </p>
      <CtaLink href="/login">Запросить новую ссылку</CtaLink>
    </div>
  );
}
