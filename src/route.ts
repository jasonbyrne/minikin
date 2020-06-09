import { Request } from "./request";

export class Route {
  public method: string;
  public uri: string;

  private get regexPath(): RegExp {
    return this.uri === "*"
      ? new RegExp(".*")
      : new RegExp(
          "^" +
            this.uri
              .replace(/\/:[A-Za-z]+/g, "/([^/]+)")
              .replace(/\/\*/, "/.*") +
            "$"
        );
  }

  constructor(path: string) {
    this._parsePath(path);
  }

  private _parsePath(path: string) {
    const arrPath = (() => {
      const arr = (path.trim() || "*").replace(/  +/g, " ").split(" ");
      return arr.length > 1 ? arr : ["*", arr[0]];
    })();
    this.method = arrPath[0].toUpperCase();
    this.uri = arrPath[arrPath.length > 1 ? 1 : 0];
  }

  private _pathMatches(req: Request) {
    const url = req.url.includes("?")
      ? req.url.substr(0, req.url.indexOf("?"))
      : req.url;
    return url.match(this.regexPath);
  }

  private _methodMatches(req: Request) {
    const methods = this.method.split("|");
    return methods.includes(req.method) || methods.includes("*");
  }

  public matches(req: Request): RegExpMatchArray | false {
    const pathMatches = this._pathMatches(req);
    const methodMathces = this._methodMatches(req);
    return (methodMathces && pathMatches) || false;
  }
}
