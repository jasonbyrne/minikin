import Response from "./response";
import Request from "./request";
import { RouteCallback } from "./interfaces";

export async function syncForEach(
  array: any[],
  callback: Function
): Promise<any> {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i]);
  }
}

export async function firstResponse(req: Request, arr: RouteCallback[]) {
  let res: Response | null = null;
  for (let i = 0; i < arr.length; i++) {
    if (!res) {
      const result = await arr[i](req);
      res =
        typeof result == "string"
          ? Response.fromString(result)
          : result || null;
    }
  }
  return res === null
    ? Response.fromString("No response", { statusCode: 500 })
    : res;
}
