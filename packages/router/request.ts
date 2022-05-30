import { JsonValue, RequestOpts } from "./interfaces";
import { objectToMap } from "./object-to-map";

const parseCookies = (headers: Map<string, string>) => {
  const cookies = new Map<string, string>();
  if (headers.has("cookie")) {
    const cookieString: string = headers.get("cookie") || "";
    cookieString.split("; ").forEach((cookie) => {
      const c = cookie.split("=");
      if (c.length > 1) {
        cookies.set(c[0], cookie.substring(c[0].length + 1));
      }
    });
  }
  return cookies;
};

const parseJson = (body: string): JsonValue | undefined => {
  try {
    return JSON.parse(body);
  } catch (ex) {
    return undefined;
  }
};

export default class MinikinRequest {
  public readonly headers: Map<string, string>;
  public readonly trailers: Map<string, string>;
  public readonly cookies: Map<string, string>;
  public readonly params = new Map<string, string>();
  public readonly method: string;
  public readonly url: string;
  public readonly content: string;
  public readonly query: URLSearchParams;
  public readonly json: JsonValue | undefined;

  constructor(private opts: RequestOpts) {
    this.headers = objectToMap(this.opts.headers);
    this.trailers = objectToMap(this.opts.trailers);
    this.cookies = parseCookies(this.headers);
    this.method = this.opts.method;
    this.url = this.opts.url;
    this.content = this.opts.body;
    this.query = new URLSearchParams(this.url.substring(this.url.indexOf("?")));
    this.json = parseJson(this.content);
  }
}
