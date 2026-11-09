import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/auth";

// Only the link from the letter comes here (GET). Requesting a link and signing out
// go through server actions, which check the address and the letter limit first.
export const { GET } = toNextJsHandler(auth);
