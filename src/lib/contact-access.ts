const contactCardPath = /^\/contacts\/(\d+)$/;

export type ContactPageAccess = "continue" | "not-found";

export async function resolveContactPage(
  pathname: string,
  contactExists: (contactId: number) => Promise<boolean>,
): Promise<ContactPageAccess> {
  const match = contactCardPath.exec(pathname);

  if (!match) {
    return "continue";
  }

  try {
    const exists = await contactExists(Number(match[1]));
    return exists ? "continue" : "not-found";
  } catch {
    // A database failure must reach the contact page, which has its own error screen.
    return "continue";
  }
}
