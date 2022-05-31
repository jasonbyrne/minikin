import Response from "./response";
import Request from "./request";
import { RouteCallback } from "./interfaces";
import { text } from "./from-text";

export async function firstResponse(
  req: Request,
  arr: RouteCallback[],
  env?: any,
  ctx?: any
) {
  let res: Response | null = null;
  for (let i = 0; i < arr.length; i++) {
    if (!res) {
      const result = await arr[i](req, env, ctx);
      res = typeof result == "string" ? text(result) : result || null;
    }
  }
  return res;
}
