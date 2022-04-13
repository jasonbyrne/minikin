import fs = require("fs");
import path = require("path");
import * as http from "http";
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
  private _content: string | Buffer;
  private _statusCode: number;
  private _statusMessage: string;
  private _headers: Headers;
  private _trailers: Headers;

  static redirect(url: string, code: number = 302) {
    return new Response("", {
      statusCode: code,
      headers: [["Location", url]],
    });
  }

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
    const fullPath = (() => {
      const possiblePaths: string[] = [
        path.join(__dirname, filePath),
        path.join(process.cwd(), filePath),
      ];
      try {
        possiblePaths.push(fs.realpathSync(filePath));
      } catch (ex) {}
      return possiblePaths.find((path) => fs.existsSync(path));
    })();
    if (!fullPath) {
      return Response.fromString(`${filePath} was not found`, {
        statusCode: 404,
      });
    }
    const extension = path.extname(fullPath).substring(1);
    const content = fs.readFileSync(fullPath, encoding);
    return new Response(content, {
      ...{
        headers: [["Content-Type", commonFileTypes[extension] || "text/html"]],
      },
      ...opts,
    });
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

  public get code(): number {
    return this._statusCode;
  }

  public set code(value: number) {
    this._statusCode = value;
  }

  public get message(): string {
    return this._statusMessage || defaultStatusMessage[this._statusCode] || "";
  }

  public set message(value: string) {
    this._statusMessage = value;
  }

  public get content(): string | Buffer {
    return this._content;
  }

  public set content(value: string | Buffer) {
    this._content = value;
  }

  public get trailers(): Headers {
    return this._trailers;
  }

  public get headers(): OutgoingHttpHeaders {
    const headers = {
      "Content-Length": this._content.length,
      Server: "minikin",
    };
    this._headers.forEach((header) => (headers[header[0]] = header[1]));
    return headers;
  }

  public constructor(content: string | Buffer, opts: ResponseParams) {
    this._content = content || "";
    this._statusCode = opts.statusCode || 200;
    this._statusMessage = opts.statusMessage || "";
    this._headers = opts.headers || [];
    this._trailers = opts.trailers || [];
  }

  private _replace(key: string, value: string) {
    if (typeof this._content === "string") {
      this._content = this._content.replace(
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

  public cookie(key: string, value: string, params?: CookieParams): Response;
  public cookie(key: string, value: string, ttl: number): Response;
  public cookie(key: string, value: string, opt?: CookieParams | number) {
    const arrParams: string[] =
      typeof opt == "number"
        ? [`Max-Age=${opt}`]
        : opt
        ? Object.keys(opt).map((key) => `${key}=${opt[key]}`)
        : [];
    this._headers.push([
      "Set-Cookie",
      `${key}=${value}; ${arrParams.join("; ")}`,
    ]);
    return this;
  }

  public header(key: string, value: string): Response {
    this._headers.push([key, value]);
    return this;
  }

  public trailer(key: string, value: string): Response {
    this._trailers.push([key, value]);
    return this;
  }

  public send(res: http.ServerResponse) {
    res
      .writeHead(this.code, this.message, this.headers)
      .write(this.content, () => {
        res.addTrailers(this.trailers);
        res.end();
      });
    return this;
  }
}
