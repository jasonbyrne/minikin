import * as http from "http";
import { iRequestOpts, KeyValue } from "./interfaces";

export class Request {
  public method: string;
  public url: string;
  public headers: http.IncomingHttpHeaders;
  public trailers: http.IncomingHttpHeaders;
  public body: string;
  public json: any;
  public params: KeyValue;
  public query: KeyValue;

  constructor(opts: iRequestOpts) {
    this.method = opts.method;
    this.url = opts.url;
    this.headers = opts.headers;
    this.trailers = opts.trailers;
    this.body = opts.body;
    this.params = opts.params;
    this.json = typeof opts.json == "undefined" ? null : opts.json;
    this.query = opts.query || {};
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
