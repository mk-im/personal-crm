// Server actions call redirect(); Next throws a special error that unstable_rethrow passes through.
export class RedirectSignal extends Error {
  constructor(public readonly location: string) {
    super(`redirect:${location}`);
  }
}

export const currentUserId = { value: "" };

// Use these as vi.mock factories in a test file: vi.mock("next/navigation", navigationMock).
export const cacheMock = () => ({ revalidatePath: () => undefined });

export const navigationMock = () => ({
  redirect: (location: string) => {
    throw new RedirectSignal(location);
  },
  unstable_rethrow: (error: unknown) => {
    if (error instanceof RedirectSignal) {
      throw error;
    }
  },
});

export const sessionMock = () => ({
  requireUserId: async () => {
    if (!currentUserId.value) {
      throw new RedirectSignal("/login");
    }
    return currentUserId.value;
  },
});

export function formData(fields: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of Array.isArray(value) ? value : [value]) {
      data.append(key, item);
    }
  }
  return data;
}

export async function expectRedirect(work: Promise<unknown>) {
  try {
    await work;
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return error.location;
    }
    throw error;
  }
  throw new Error("expected a redirect");
}
