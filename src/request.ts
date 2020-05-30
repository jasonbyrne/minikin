import * as http from "http";

interface KeyValue {
  [key: string]: string;
}

export type HttpMethod =
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

interface iRequestOpts {
  method: HttpMethod;
  url: string;
  headers: http.IncomingHttpHeaders;
  body: string;
  params: KeyValue;
}

export class Request implements iRequestOpts {
  public method: HttpMethod;
  public url: string;
  public headers: http.IncomingHttpHeaders;
  public body: string;
  public params: KeyValue;

  constructor(opts: iRequestOpts) {
    this.method = opts.method;
    this.url = opts.url;
    this.headers = opts.headers;
    this.body = opts.body;
    this.params = opts.params;
  }

  public get cookies(): KeyValue {
    const cookieString = this.headers.cookie || "";
    const cookies: KeyValue = {};
    cookieString.split("; ").forEach((cookie) => {
      const c = cookie.split("=");
      c.length > 1 && (cookies[c[0]] = cookie.substr(c[0].length + 1));
    });
    return cookies;
  }
}
