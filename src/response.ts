import fs = require("fs");
import path = require("path");
import { OutgoingHttpHeaders } from "http";

const commonFileTypes = {
  html: "text/html",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  pdf: "application/pdf",
  css: "text/css",
  ico: "image/vnd.microsoft.icon",
  js: "text/javascript",
  json: "application/json",
  svg: "image/svg+xml",
  txt: "text/plain",
};

const defaultStatusMessage = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Temporary Redirect",
  302: "Permanent Redirect",
  400: "Bad Request",
  401: "Not Authenticated",
  403: "Permission Denied",
  404: "Not Found",
  500: "Unknown Error",
  504: "Gateway Timeout",
};

export interface OptionalParams {
  statusCode?: number;
  statusMessage?: string;
  headers?: Headers;
}

export type Headers = [string, string][];

export class Response {
  private _content: string | Buffer;
  private _statusCode: number;
  private _statusMessage: string;
  private _headers: Headers = [["Content-Type", "text/html"]];

  static fromBinary(filePath: string, opts?: OptionalParams) {
    return Response.fromFile(filePath, opts, "binary");
  }

  static fromFile(
    filePath: string,
    opts?: OptionalParams,
    encoding:
      | "utf8"
      | "binary"
      | "hex"
      | "ascii"
      | "base64"
      | "latin1"
      | null = "utf8"
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

  static fromString(content: string, opts?: OptionalParams) {
    return new Response(content, {
      ...{
        headers: [["Content-Type", "text/plain"]],
      },
      ...opts,
    });
  }

  static fromJson(json: any, opts?: OptionalParams) {
    return new Response(JSON.stringify(json), {
      ...{
        headers: [["Content-Type", "application/json"]],
      },
      ...opts,
    });
  }

  public get statusCode(): number {
    return this._statusCode;
  }

  public get statusMessage(): string {
    return this._statusMessage || defaultStatusMessage[this._statusCode] || "";
  }

  public get content(): string | Buffer {
    return this._content;
  }

  public get headers(): OutgoingHttpHeaders {
    const headers = {
      "Content-Length": this._content.length,
    };
    this._headers.forEach((header) => {
      headers[header[0]] = header[1];
    });
    return headers;
  }

  public constructor(content: string | Buffer, opts: OptionalParams) {
    this._content = content || "";
    this._statusCode = opts.statusCode || 200;
    this._statusMessage = opts.statusMessage || "";
    opts.headers?.forEach((header) => {
      this.setHeader(header[0], header[1]);
    });
  }

  public replace(key: string, value: string): Response {
    if (typeof this._content === "string") {
      this._content = this._content.replace("${" + key + "}", value);
    }
    return this;
  }

  public parse(replace: { [key: string]: string }): Response {
    for (let key in replace) {
      this.replace(key, replace[key]);
    }
    return this;
  }

  public setHeader(key: string, value: string) {
    const i = this.indexOfHeader(key);
    if (i >= 0) {
      this._headers[i][1] = value;
    } else {
      this._headers.push([key, value]);
    }
  }

  public getHeader(key: string): string | null {
    const i = this.indexOfHeader(key);
    return i >= 0 ? this._headers[i][1] : null;
  }

  public indexOfHeader(key: string): number {
    let index: number = -1;
    key = key.toLowerCase();
    this._headers.some((header, i) => {
      if (header[0].toLowerCase() == key) {
        index = i;
        return true;
      }
      return false;
    });
    return index;
  }
}
