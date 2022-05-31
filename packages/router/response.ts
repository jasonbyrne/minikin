import { mapToObject } from "./map-to-object";
import {
  TemplateKeyValues,
  ResponseParams,
  CookieParams,
  ResponseContent,
  defaultStatusMessage,
} from "./interfaces";
import { objectToMap } from "./object-to-map";

export default class MinikinResponse {
  public headers: Map<string, string>;
  public trailers: Map<string, string>;
  public readonly status: number;
  public readonly statusText: string;

  public constructor(
    private _content: ResponseContent,
    private _opts: ResponseParams
  ) {
    this.headers = objectToMap(this._opts.headers);
    this.trailers = objectToMap(this._opts.trailers);
    this.status = this._opts.status || 200;
    this.statusText =
      this._opts.statusText || defaultStatusMessage[this.status] || "";
  }

  public content(): ResponseContent;
  public content(value: ResponseContent): MinikinResponse;
  public content(value?: ResponseContent) {
    if (value !== undefined) return this.clone(value);
    return this._content;
  }

  public clone(newContent?: ResponseContent) {
    return new MinikinResponse(newContent || this.content(), {
      ...this._opts,
      headers: mapToObject(this.headers),
      trailers: mapToObject(this.trailers),
    });
  }

  public render(data: TemplateKeyValues): MinikinResponse {
    let content = String(this.content());
    for (let key in data) {
      content = content.replace(
        new RegExp(`{{ *${key} *}}`, "g"),
        String(data[key])
      );
    }
    content = eval("`" + content + "`");
    return this.clone(content);
  }

  public cookie(
    key: string,
    value: string,
    params?: CookieParams
  ): MinikinResponse;
  public cookie(key: string, value: string, ttl: number): MinikinResponse;
  public cookie(key: string, value: string, opt?: CookieParams | number) {
    const arrParams: string[] =
      typeof opt == "number"
        ? [`Max-Age=${opt}`]
        : opt
        ? Object.keys(opt).map((key) => `${key}=${opt[key]}`)
        : [];
    this.headers.set("Set-Cookie", `${key}=${value}; ${arrParams.join("; ")}`);
    return this;
  }

  public header(key: string, value: string) {
    this.headers.set(key, value);
    return this;
  }

  public trailer(key: string, value: string) {
    this.trailers.set(key, value);
    return this;
  }
}
