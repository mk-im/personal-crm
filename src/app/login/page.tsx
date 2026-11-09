import { redirect } from "next/navigation";
import { Suspense } from "react";

import { SignInForm } from "@/components/sign-in-form";
import { getSessionUser } from "@/lib/session";

async function LoginContent() {
  const user = await getSessionUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      <h1 className="text-lead font-medium lg:text-lead-lg">Вход</h1>
      <p className="text-ui-14 text-muted lg:text-ui-16">
        Напиши почту, мы пришлём ссылку для входа. Пароль не нужен.
      </p>
      <SignInForm />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
      <LoginContent />
    </Suspense>
  );
}
