import { ResponseParams } from "./interfaces";
import MinikinResponse from "./response";

export const text = (content: string, opts?: ResponseParams) => {
  return new MinikinResponse(content, {
    ...{
      headers: { "Content-Type": "text/plain" },
    },
    ...opts,
  });
};
