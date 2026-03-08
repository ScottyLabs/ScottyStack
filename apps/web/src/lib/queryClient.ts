import { MutationCache, QueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export function getQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (err) => {
        let message = "Something went wrong";
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === "object") {
          if ("message" in (err as object)) {
            message = (err as { message: string }).message;
          }
          if ("details" in (err as object)) {
            message += `: ${(err as { details: unknown }).details}`;
          }
        }
        toast.error(message);
      },
    }),
  });
}
