import { Request, HttpMethod } from "./request";
import { Response } from "./response";

export type RouteCallback = (req: Request) => Response | Promise<Response>;

export type Handler = [HttpMethod, string, RouteCallback];
