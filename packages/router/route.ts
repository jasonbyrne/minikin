import Request from "./request";

export default class Route {
  public readonly method: string;
  public readonly url: string;

  private get _regexPath(): RegExp {
    return this.url === "*"
      ? new RegExp(".*")
      : new RegExp(
          "^" +
            this.url
              .replace(/\/:[A-Za-z]+/g, "/([^/]+)")
              .replace(/\/\*/, "/.*") +
            "$"
        );
  }

  constructor(path: string) {
    const arrPath = (() => {
      const arr = (path.trim() || "*").replace(/  +/g, " ").split(" ");
      return arr.length > 1 ? arr : ["*", arr[0]];
    })();
    this.method = arrPath[0].toUpperCase() || "GET";
    this.url = arrPath[arrPath.length > 1 ? 1 : 0] || "/";
  }

  private _pathMatches(req: Request) {
    const url = req.url.includes("?")
      ? req.url.substring(0, req.url.indexOf("?"))
      : req.url;
    return url.match(this._regexPath);
  }

  private _methodMatches(req: Request) {
    const methods = this.method.split("|");
    return methods.includes(req.method) || methods.includes("*");
  }

  public matches(req: Request): RegExpMatchArray | false {
    return (this._methodMatches(req) && this._pathMatches(req)) || false;
  }
}
