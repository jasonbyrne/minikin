import { Request } from "./request";
import { Response } from "./response";
import { Server } from "./server";
import { Router } from "./router";
import { Handler } from "./handler";
import { Route } from "./route";
import { Afterware } from "./afterware";
import {
  ResponseParams,
  Headers,
  RouteCallback,
  CookieParams,
} from "./interfaces";

export {
  Server,
  Router,
  Response,
  Request,
  RouteCallback,
  Headers,
  ResponseParams,
  CookieParams,
  Route,
  Handler,
  Afterware,
};

export default class {
  static server = Server.listen;
  static router = Router.create;
}
