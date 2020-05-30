import * as http from "http";

export type HttpMethod =
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export interface Request {
  method: HttpMethod;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
  params: { [key: string]: string };
}
