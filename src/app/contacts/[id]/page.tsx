import { ContactCard } from "@/components/contact-card";

export default function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  return <ContactCard params={params} />;
}
