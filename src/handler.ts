import { MinikinRequest, HttpMethod } from "./request";
import { MinikinResponse } from "./response";

export type MinikinRouteCallback = (
  req: MinikinRequest
) => MinikinResponse | Promise<MinikinResponse>;

export type MinikinHandler = [HttpMethod, string, MinikinRouteCallback];
