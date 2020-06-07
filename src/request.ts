import * as http from "http";
import { iRequest, KeyValue } from "./interfaces";

export class Request implements iRequest {
  public method: string;
  public url: string;
  public headers: http.IncomingHttpHeaders;
  public trailers: http.IncomingHttpHeaders;
  public body: string;
  public params: KeyValue;

  constructor(opts: iRequest) {
    this.method = opts.method;
    this.url = opts.url;
    this.headers = opts.headers;
    this.trailers = opts.trailers;
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
