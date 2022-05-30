import { ResponseParams } from "./interfaces";
import MinikinResponse from "./response";

export const json = (json: any, opts?: ResponseParams) => {
  return new MinikinResponse(JSON.stringify(json), {
    ...{
      headers: { "Content-Type": "application/json" },
    },
    ...opts,
  });
};
