import * as http from "http";
import { Request } from "./request";
import { Response } from "./response";
import { RouteCallback, Handler, iRouter } from "./interfaces";

const asyncFirstResponse = async (req: Request, arr: RouteCallback[]) => {
  let res: Response | null = null;
  for (let i = 0; i < arr.length; i++) {
    if (!res) {
      res = (await arr[i](req)) || null;
    }
  }
  return res === null
    ? Response.fromString("No response", { statusCode: 500 })
    : res;
};

export class Router implements iRouter {
  #prelims: Handler[] = [];
  #handlers: Handler[] = [];

  public static create() {
    return new Router();
  }

  private constructor() {}

  private async _parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((resolve) => {
      const chunks: any[] = [];
      req
        .on("data", (chunk: any) => {
          chunks.push(chunk);
        })
        .on("end", () => {
          resolve(
            new Request({
              body: Buffer.concat(chunks).toString(),
              url: req.url || "/",
              headers: req.headers,
              trailers: req.trailers,
              method: req.method?.toUpperCase() || "GET",
              params: {},
            })
          );
        });
    });
  }

  private _pathMatches(handler: Handler, req: Request) {
    const regexPath =
      handler[1] === "*"
        ? new RegExp(".*")
        : new RegExp(
            "^" +
              handler[1]
                .replace(/\/:[A-Za-z]+/g, "/([^/]+)")
                .replace(/\/\*/, "/.*") +
              "$"
          );
    return req.url?.match(regexPath);
  }

  private _methodMatches(handler: Handler, req: Request) {
    const methods = handler[0].split("|");
    return methods.includes(req.method) || methods.includes("*");
  }

  private _parseParams(
    handler: Handler,
    pathMatches: RegExpMatchArray,
    req: Request
  ) {
    const params = handler[1].match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substr(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params[key] = pathMatches[i + 1];
      });
    }
  }

  private async _handle(req: Request): Promise<Response | false> {
    const handlers = [...this.#prelims, ...this.#handlers];
    for (let i = 0; i < handlers.length; i++) {
      const handler = handlers[i];
      const pathMatches = this._pathMatches(handler, req);
      const methodMathces = this._methodMatches(handler, req);
      if (methodMathces && pathMatches) {
        this._parseParams(handler, pathMatches, req);
        try {
          const myResponse = await asyncFirstResponse(req, handler[2]);
          return (
            myResponse ||
            Response.fromString("No content in response", { statusCode: 500 })
          );
        } catch (ex) {
          return Response.fromString(`Unhandled exception: ${ex}`, {
            statusCode: 500,
          });
        }
      }
    }
    return false;
  }

  private _parsePath(path: string) {
    const arrPath = (() => {
      const arr = (path.trim() || "*").replace(/  +/g, " ").split(" ");
      return arr.length > 1 ? arr : ["*", arr[0]];
    })();
    return {
      method: arrPath.length > 1 ? arrPath[0].toUpperCase() : "GET",
      uri: arrPath[arrPath.length > 1 ? 1 : 0],
    };
  }

  private _handleOverload(
    a: string | RouteCallback,
    b: RouteCallback[]
  ): [string, string, RouteCallback[]] {
    const path = typeof a == "string" ? a : "*";
    const callbacks =
      typeof a == "string"
        ? b
        : (() => {
            b.unshift(a);
            return b;
          })();
    const { method, uri } = this._parsePath(path);
    return [method, uri, callbacks];
  }

  public use(path: string, ...callbacks: RouteCallback[]): iRouter;
  public use(...callbacks: RouteCallback[]): iRouter;
  public use(a: string | RouteCallback, ...b: RouteCallback[]): iRouter {
    this.#prelims.push(this._handleOverload(a, b));
    return this;
  }

  public route(path: string, ...callbacks: RouteCallback[]): iRouter;
  public route(...callbacks: RouteCallback[]): iRouter;
  public route(a: string | RouteCallback, ...b: RouteCallback[]): iRouter {
    this.#handlers.push(this._handleOverload(a, b));
    return this;
  }

  public async handle(req: http.IncomingMessage) {
    const myReq = await this._parseRequest(req);
    const response = await this._handle(myReq);
    return response || Response.fromString("Not Found", { statusCode: 404 });
  }
}
