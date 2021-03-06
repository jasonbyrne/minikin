import * as http from "http";
import { Request } from "./request";
import { Response } from "./response";
import { Handler } from "./handler";

export const commonFileTypes = {
  html: "text/html",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
  css: "text/css",
  ico: "image/vnd.microsoft.icon",
  js: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  txt: "text/plain",
};

export const defaultStatusMessage = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Temporary Redirect",
  302: "Permanent Redirect",
  400: "Bad Request",
  401: "Not Authenticated",
  403: "Permission Denied",
  404: "Not Found",
  500: "Unknown Error",
  504: "Gateway Timeout",
};

export interface ResponseParams {
  statusCode?: number;
  statusMessage?: string;
  headers?: Headers;
  trailers?: Headers;
}

export type Headers = [string, string][];
export type TemplateKeyValues = { [key: string]: string };
export type Encoding =
  | "utf8"
  | "binary"
  | "hex"
  | "ascii"
  | "base64"
  | "latin1"
  | null;

export interface CookieParams {
  "Max-Age"?: number;
  Domain?: string;
  Path?: string;
  HttpOnly?: boolean;
  SameSite?: string;
  Expires?: Date;
}

export interface KeyValue {
  [key: string]: string;
}

export interface iRequestOpts {
  method: string;
  url: string;
  headers: http.IncomingHttpHeaders;
  trailers: http.IncomingHttpHeaders;
  body: string;
  params: KeyValue;
  query?: KeyValue;
  json?: any;
}

export type RouteCallback = (
  req: Request
) => Response | void | Promise<Response | void>;

export type AfterCallback = (
  response: Response,
  request: Request
) => void | Response | Promise<void | Response>;

export interface iRouter {
  use(path: string, ...callbacks: RouteCallback[]): iRouter;
  use(...callbacks: RouteCallback[]): iRouter;
  route(path: string, ...callbacks: RouteCallback[]): Handler;
  route(...callbacks: RouteCallback[]): Handler;
  routes(routes: { [path: string]: RouteCallback[] | RouteCallback }): iRouter;
  handle(req: http.IncomingMessage): Promise<Response>;
  afterAll(path: string, ...callbacks: AfterCallback[]): iRouter;
  afterAll(...callbacks: AfterCallback[]): iRouter;
}
