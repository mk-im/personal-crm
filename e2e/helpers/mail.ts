// Reads sign-in letters from the local Mailpit stub; no real mailbox is involved.
const mailpitUrl = process.env.MAILPIT_URL ?? "http://127.0.0.1:8025";

type MessageSummary = { ID: string; Created: string };
type Message = {
  Text: string;
  HTML: string;
  Subject: string;
  From: { Name: string; Address: string };
};

async function searchMessages(to: string): Promise<MessageSummary[]> {
  const response = await fetch(
    `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
  );

  if (!response.ok) {
    throw new Error(`Mailpit search failed: ${response.status}`);
  }

  const body = (await response.json()) as { messages: MessageSummary[] };
  return body.messages;
}

export async function countLetters(to: string) {
  return (await searchMessages(to)).length;
}

export async function latestLetter(to: string, options: { after?: number } = {}) {
  const deadline = Date.now() + 15_000;

  while (Date.now() < deadline) {
    const messages = await searchMessages(to);
    const fresh = messages.filter(
      (message) => !options.after || new Date(message.Created).getTime() >= options.after,
    );

    if (fresh.length > 0) {
      const response = await fetch(`${mailpitUrl}/api/v1/message/${fresh[0].ID}`);
      const message = (await response.json()) as Message;
      const link = /https?:\/\/\S+/.exec(message.Text)?.[0];

      if (!link) {
        throw new Error("No link in the sign-in letter");
      }

      return { ...message, link };
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`No letter for ${to} in the stub`);
}
