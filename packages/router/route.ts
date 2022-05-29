import Request from "./request";

export default class Route {
  public method: string = "GET";
  public uri: string = "/";

  get #regexPath(): RegExp {
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
    this.#parsePath(path);
  }

  #parsePath(path: string) {
    const arrPath = (() => {
      const arr = (path.trim() || "*").replace(/  +/g, " ").split(" ");
      return arr.length > 1 ? arr : ["*", arr[0]];
    })();
    this.method = arrPath[0].toUpperCase();
    this.uri = arrPath[arrPath.length > 1 ? 1 : 0];
  }

  #pathMatches(req: Request) {
    const url = req.url.includes("?")
      ? req.url.substring(0, req.url.indexOf("?"))
      : req.url;
    return url.match(this.#regexPath);
  }

  #methodMatches(req: Request) {
    const methods = this.method.split("|");
    return methods.includes(req.method) || methods.includes("*");
  }

  public matches(req: Request): RegExpMatchArray | false {
    const pathMatches = this.#pathMatches(req);
    const methodMathces = this.#methodMatches(req);
    return (methodMathces && pathMatches) || false;
  }
}
