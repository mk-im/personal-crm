import { cn } from "cn";

import { type AvatarTone } from "@/lib/contact-style";

const tones: Record<AvatarTone, string> = {
  "blue-1": "bg-blue-1 text-white",
  "blue-2": "bg-blue-2 text-white",
  "blue-3": "bg-blue-3 text-white",
  sky: "bg-sky text-blue-2",
};

export function Avatar({
  initials,
  tone = "blue-1",
  className,
}: {
  initials: string;
  tone?: AvatarTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid size-10 flex-none place-items-center rounded-full text-ui-14 font-bold lg:size-11 lg:text-ui-15",
        tones[tone],
        className,
      )}
    >
      {initials}
    </div>
  );
}
