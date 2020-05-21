import fs = require("fs");
import path = require("path");

export interface optionalParams {
  statusCode?: number;
  mimeType?: string;
}

export class MinikinResponse {
  private _content: string = "";
  private _statusCode: number = 200;
  private _mimeType: string = "text/html";

  static createFromFile(filePath: string, opts?: optionalParams) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      return new MinikinResponse({
        ...{ content: fs.readFileSync(fullPath, "utf8") },
        ...opts,
      });
    } else {
      return MinikinResponse.createFromString(`${fullPath} was not found`, {
        statusCode: 404,
      });
    }
  }

  static createFromString(content: string, opts?: optionalParams) {
    return new MinikinResponse({
      ...{ content: content },
      ...opts,
    });
  }

  static createFromJson(json: any, opts?: optionalParams) {
    return new MinikinResponse({
      ...{ content: JSON.stringify(json) },
      ...opts,
    });
  }

  public get mimeType(): string {
    return this._mimeType;
  }

  public get statusCode(): number {
    return this._statusCode;
  }

  public get content(): string {
    return this._content;
  }

  public constructor(opts: {
    content: string;
    statusCode?: number;
    mimeType?: string;
  }) {
    this._statusCode = opts.statusCode || this._statusCode;
    this._mimeType = opts.mimeType || this._mimeType;
    this._content = opts.content;
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
}
