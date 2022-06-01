import MinikinRequest from "./request";
import MinikinResponse from "./response";

export const defaultStatusMessage = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Temporary Redirect",
  302: "Permanent Redirect",
  400: "Bad Request",
  401: "Not Authenticated",
  402: "Payment Required",
  403: "Permission Denied",
  404: "Not Found",
  409: "Conflict",
  410: "Gone",
  500: "Unknown Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

export interface ResponseParams {
  status?: number;
  statusText?: string;
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

export type KeyValue = Record<string, string>;

export interface RequestOpts {
  method: string;
  url: string;
  headers: KeyValue;
  trailers?: KeyValue;
  body: string;
}

export type RouteCallback = (
  req: MinikinRequest,
  env?: any,
  ctx?: any
) => MinikinResponse | string | void | Promise<MinikinResponse | string | void>;

export type AfterCallback = (
  response: MinikinResponse | null,
  request: MinikinRequest,
  env?: any,
  ctx?: any
) => void | MinikinResponse | Promise<void | MinikinResponse>;

export type Routes = { [path: string]: RouteCallback[] | RouteCallback };

/*
export type JsonValue =
  | string
  | number
  | boolean
  | { [x: string]: JsonValue }
  | Array<JsonValue>;
  */
export type JsonValue = any;

export type RouterInit = {
  routes?: Routes;
  base?: string;
  passThroughOnException?: boolean;
};

export type ResponseContent = string | Buffer;
