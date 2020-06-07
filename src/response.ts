import fs = require("fs");
import path = require("path");
import { OutgoingHttpHeaders } from "http";
import {
  TemplateKeyValues,
  ResponseParams,
  Encoding,
  Headers,
  commonFileTypes,
  defaultStatusMessage,
  CookieParams,
} from "./interfaces";

export class Response {
  #content: string | Buffer;
  #statusCode: number;
  #statusMessage: string;
  #headers: Headers;
  #trailers: Headers;

  static fromTemplate(
    filePath: string,
    kv: TemplateKeyValues,
    opts?: ResponseParams
  ) {
    return Response.fromFile(filePath, opts).render(kv);
  }

  static fromBinary(filePath: string, opts?: ResponseParams) {
    return Response.fromFile(filePath, opts, "binary");
  }

  static fromFile(
    filePath: string,
    opts?: ResponseParams,
    encoding: Encoding = "utf8"
  ) {
    const fullPath = path.join(process.cwd(), filePath);
    const extension = path.extname(fullPath).substr(1);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, encoding);
      return new Response(content, {
        ...{
          headers: [
            ["Content-Type", commonFileTypes[extension] || "text/html"],
          ],
        },
        ...opts,
      });
    } else {
      return Response.fromString(`${fullPath} was not found`, {
        statusCode: 404,
      });
    }
  }

  static fromString(content: string, opts?: ResponseParams) {
    return new Response(content, {
      ...{
        headers: [["Content-Type", "text/plain"]],
      },
      ...opts,
    });
  }

  static fromJson(json: any, opts?: ResponseParams) {
    return new Response(JSON.stringify(json), {
      ...{
        headers: [["Content-Type", "application/json"]],
      },
      ...opts,
    });
  }

  public get statusCode(): number {
    return this.#statusCode;
  }

  public get statusMessage(): string {
    return this.#statusMessage || defaultStatusMessage[this.#statusCode] || "";
  }

  public get content(): string | Buffer {
    return this.#content;
  }

  public get trailers(): Headers {
    return this.#trailers;
  }

  public get headers(): OutgoingHttpHeaders {
    const headers = {
      "Content-Length": this.#content.length,
      Server: "minikin",
    };
    this.#headers.forEach((header) => (headers[header[0]] = header[1]));
    return headers;
  }

  public constructor(content: string | Buffer, opts: ResponseParams) {
    this.#content = content || "";
    this.#statusCode = opts.statusCode || 200;
    this.#statusMessage = opts.statusMessage || "";
    this.#headers = opts.headers || [];
    this.#trailers = opts.trailers || [];
  }

  private _replace(key: string, value: string) {
    if (typeof this.#content === "string") {
      this.#content = this.#content.replace(
        new RegExp(`{{ *${key} *}}`, "g"),
        value
      );
    }
  }

  public render(replace: TemplateKeyValues): Response {
    for (let key in replace) {
      this._replace(key, replace[key]);
    }
    return this;
  }

  public addCookie(key: string, value: string, params?: CookieParams): Response;
  public addCookie(key: string, value: string, ttl: number): Response;
  public addCookie(key: string, value: string, opt?: CookieParams | number) {
    const arrParams: string[] =
      typeof opt == "number"
        ? [`Max-Age=${opt}`]
        : opt
        ? Object.keys(opt).map((key) => `${key}=${opt[key]}`)
        : [];
    this.#headers.push([
      "Set-Cookie",
      `${key}=${value}; ${arrParams.join("; ")}`,
    ]);
    return this;
  }

  public addHeader(key: string, value: string): Response {
    this.#headers.push([key, value]);
    return this;
  }

  public addTrailer(key: string, value: string): Response {
    this.#trailers.push([key, value]);
    return this;
  }
}
