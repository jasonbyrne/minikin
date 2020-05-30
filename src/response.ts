import fs = require("fs");
import path = require("path");
import { OutgoingHttpHeaders } from "http";

export interface optionalParams {
  statusCode?: number;
  headers?: MinikinHeaders;
}

export type MinikinHeader = [string, string];
export type MinikinHeaders = [string, string][];

export class MinikinResponse {
  private _content: string = "";
  private _statusCode: number = 200;
  private _headers: MinikinHeaders = [["Content-Type", "text/html"]];

  static createFromFile(filePath: string, opts?: optionalParams) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return new MinikinResponse(fs.readFileSync(fullPath, "utf8"), {
        ...opts,
      });
    } else {
      return MinikinResponse.createFromString(`${fullPath} was not found`, {
        statusCode: 404,
      });
    }
  }

  static createFromString(content: string, opts?: optionalParams) {
    return new MinikinResponse(content, { ...opts });
  }

  static createFromJson(json: any, opts?: optionalParams) {
    return new MinikinResponse(JSON.stringify(json), { ...opts });
  }

  public get statusCode(): number {
    return this._statusCode;
  }

  public get content(): string {
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

  public constructor(content: string, opts: optionalParams) {
    this._content = content;
    this._statusCode = opts.statusCode || this._statusCode;
    opts.headers?.forEach((header) => {
      this.setHeader(header[0], header[1]);
    });
  }

  public replace(key: string, value: string): MinikinResponse {
    this._content = this._content.replace("${" + key + "}", value);
    return this;
  }

  public parse(replace: { [key: string]: string }): MinikinResponse {
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
