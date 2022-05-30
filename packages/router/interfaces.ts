import MinikinRequest from "./request";
import MinikinResponse from "./response";

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
  headers?: KeyValue;
  trailers?: KeyValue;
}

export type TemplateKeyValues = { [key: string]: unknown };
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

export type Value = string | string[] | undefined;
export type KeyValue = Record<string, Value>;

export interface RequestOpts {
  method: string;
  url: string;
  headers: KeyValue;
  trailers: KeyValue;
  body: string;
}

export type RouteCallback = (
  req: MinikinRequest
) => MinikinResponse | string | void | Promise<MinikinResponse | string | void>;

export type AfterCallback = (
  response: MinikinResponse,
  request: MinikinRequest
) => void | MinikinResponse | Promise<void | MinikinResponse>;

export type Routes = { [path: string]: RouteCallback[] | RouteCallback };
