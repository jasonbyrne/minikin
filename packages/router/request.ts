import { RequestOpts, KeyValue } from "./interfaces";

export default class MinikinRequest {
  public method: string;
  public url: string;
  public headers: KeyValue;
  public trailers: KeyValue;
  public body: string;
  public params: KeyValue = {};

  public get json() {
    try {
      return JSON.parse(this.body);
    } catch (ex) {
      return undefined;
    }
  }

  public get query() {
    return new URLSearchParams(this.url.substring(this.url.indexOf("?")));
  }

  constructor(opts: RequestOpts) {
    this.method = opts.method;
    this.url = opts.url;
    this.headers = opts.headers;
    this.trailers = opts.trailers;
    this.body = opts.body;
  }

  public get cookies(): KeyValue {
    const cookieString: string = this.headers.cookie
      ? String(this.headers.cookie)
      : "";
    const cookies: KeyValue = {};
    cookieString.split("; ").forEach((cookie) => {
      const c = cookie.split("=");
      c.length > 1 && (cookies[c[0]] = cookie.substring(c[0].length + 1));
    });
    return cookies;
  }
}
