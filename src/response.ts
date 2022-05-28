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

export default class MinikinResponse {
  #content: string | Buffer;
  #statusCode: number;
  #statusMessage: string;
  #headers: Headers;
  #trailers: Headers;

  static redirect(url: string, code: number = 302) {
    return new MinikinResponse("", {
      statusCode: code,
      headers: [["Location", url]],
    });
  }

  static fromTemplate(
    filePath: string,
    kv: TemplateKeyValues,
    opts?: ResponseParams
  ) {
    return MinikinResponse.fromFile(filePath, opts).render(kv);
  }

  static fromBinary(filePath: string, opts?: ResponseParams) {
    return MinikinResponse.fromFile(filePath, opts, "binary");
  }

  static fromFile(
    filePath: string,
    opts?: ResponseParams,
    encoding: Encoding = "utf8"
  ) {
    filePath = path.normalize(filePath);
    const possiblePaths: string[] = [
      path.resolve(filePath),
      path.join(__dirname, filePath),
      path.join(process.cwd(), filePath),
      path.join(path.dirname(process.argv[1]), filePath),
    ];
    if (require.main) {
      possiblePaths.push(
        path.join(path.dirname(require.main?.filename), filePath)
      );
    }
    try {
      possiblePaths.push(fs.realpathSync(filePath));
    } catch (ex) {}
    const fullPath = possiblePaths.find((path) => fs.existsSync(path));
    if (!fullPath) {
      console.error(possiblePaths);
      return MinikinResponse.fromJson(
        {
          message: `${filePath} was not found`,
        },
        {
          statusCode: 404,
        }
      );
    }
    const extension = path.extname(fullPath).substring(1);
    const content = fs.readFileSync(fullPath, encoding);
    return new MinikinResponse(content, {
      ...{
        headers: [["Content-Type", commonFileTypes[extension] || "text/html"]],
      },
      ...opts,
    });
  }

  static fromString(content: string, opts?: ResponseParams) {
    return new MinikinResponse(content, {
      ...{
        headers: [["Content-Type", "text/plain"]],
      },
      ...opts,
    });
  }

  static fromJson(json: any, opts?: ResponseParams) {
    return new MinikinResponse(JSON.stringify(json), {
      ...{
        headers: [["Content-Type", "application/json"]],
      },
      ...opts,
    });
  }

  public get code(): number {
    return this.#statusCode;
  }

  public set code(value: number) {
    this.#statusCode = value;
  }

  public get message(): string {
    return this.#statusMessage || defaultStatusMessage[this.#statusCode] || "";
  }

  public set message(value: string) {
    this.#statusMessage = value;
  }

  public get content(): string | Buffer {
    return this.#content;
  }

  public set content(value: string | Buffer) {
    this.#content = value;
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

  private _replace(key: string, value: unknown) {
    if (typeof this.#content === "string") {
      this.#content = this.#content.replace(
        new RegExp(`{{ *${key} *}}`, "g"),
        String(value)
      );
    }
  }

  public render(data: TemplateKeyValues) {
    if (typeof this.#content === "string") {
      for (let key in data) {
        this._replace(key, data[key]);
      }
      this.#content = eval("`" + this.#content + "`");
    }
    return this;
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
    this.#headers.push([
      "Set-Cookie",
      `${key}=${value}; ${arrParams.join("; ")}`,
    ]);
    return this;
  }

  public header(key: string, value: string) {
    this.#headers.push([key, value]);
    return this;
  }

  public trailer(key: string, value: string) {
    this.#trailers.push([key, value]);
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

  public forServiceWorker() {
    return new Response(this.content, {
      headers: this.#headers,
      status: this.#statusCode,
      statusText: this.#statusMessage,
    });
  }
}
