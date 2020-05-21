import * as http from "http";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface MinikinRequest {
  method: HttpMethod;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
  params: { [key: string]: string };
}
