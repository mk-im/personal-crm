import { ContactForm } from "@/components/contact-form";

export default function NewContactPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Новый контакт</h1>
      <ContactForm />
    </div>
  );
}
