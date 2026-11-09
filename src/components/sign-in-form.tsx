"use client";

import { useActionState } from "react";

import { CtaButton } from "@/components/cta-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSignIn, type SignInState } from "@/server/sign-in";

const initialState: SignInState = {};

export function SignInForm() {
  const [state, formAction, pending] = useActionState(requestSignIn, initialState);

  return (
    <form
      action={formAction}
      // The server checks the address, so the form and a direct request give the same message.
      noValidate
      className="flex flex-col gap-4 rounded-r22 bg-white p-4.5 shadow-card lg:rounded-r26 lg:p-6.5 lg:shadow-card-lg"
    >
      <div className="rounded-r14 bg-mist px-3 py-2.5 lg:rounded-r16 lg:px-4 lg:py-3.5">
        <Label htmlFor="email" className="mb-1">
          Почта
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="border-transparent bg-transparent px-0 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-ui-14 text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="text-ui-14 text-label">
          {state.message}
        </p>
      ) : null}
      <CtaButton type="submit" disabled={pending} className="w-full">
        {pending ? "Отправляем…" : "Получить ссылку"}
      </CtaButton>
    </form>
  );
}
