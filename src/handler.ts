import { Request, HttpMethod } from "./request";
import { Response } from "./response";

export type RouteCallback = (
  req: Request
) => Response | void | Promise<Response | void>;

export type Handler = [HttpMethod, string, RouteCallback];
