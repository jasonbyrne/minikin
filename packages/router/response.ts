import { mapToObject } from "./map-to-object";
import { TemplateKeyValues, ResponseParams, CookieParams } from "./interfaces";
import { objectToMap } from "./object-to-map";

export default class MinikinResponse {
  public headers: Map<string, string>;
  public trailers: Map<string, string>;

  public get status() {
    return this.opts.statusCode || 200;
  }

  public get statusText() {
    return this.opts.statusMessage || "";
  }

  public constructor(
    public content: string | Buffer,
    private opts: ResponseParams
  ) {
    this.headers = objectToMap(this.opts.headers);
    this.trailers = objectToMap(this.opts.trailers);
  }

  public clone(newContent?: string) {
    return new MinikinResponse(newContent || this.content, {
      ...this.opts,
      headers: mapToObject(this.headers),
      trailers: mapToObject(this.trailers),
    });
  }

  public render(data: TemplateKeyValues): MinikinResponse {
    let content = String(this.content);
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
