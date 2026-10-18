const tones = ["blue-1", "blue-2", "blue-3", "sky"] as const;

export type AvatarTone = (typeof tones)[number];

export function contactInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function avatarTone(name: string): AvatarTone {
  let hash = 0;

  for (const char of name) {
    hash = (hash + char.charCodeAt(0)) % tones.length;
  }

  return tones[hash];
}
