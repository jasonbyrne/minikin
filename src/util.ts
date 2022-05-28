import Response from "./response";
import Request from "./request";
import { KeyValue, RouteCallback } from "./interfaces";

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
    if (!res) res = (await arr[i](req)) || null;
  }
  return res === null
    ? Response.fromString("No response", { statusCode: 500 })
    : res;
}

export const interableToKeyValue = (
  interable: IterableIterator<[string, string]>
): KeyValue => {
  const out: KeyValue = {};
  for (const header of interable) {
    out[header[0]] = header[1];
  }
  return out;
};
