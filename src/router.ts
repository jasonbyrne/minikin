import * as http from "http";
import { Request } from "./request";
import { Response } from "./response";
import { RouteCallback, iRouter, Afterware } from "./interfaces";
import { syncForEach } from "./util";
import { Route } from "./route";
import { Handler } from "./handler";

export class Router implements iRouter {
  #prelims: Handler[] = [];
  #handlers: Handler[] = [];
  #afters: Afterware[] = [];

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

  private async _getResponse(req: Request): Promise<Response> {
    const handlers = [...this.#prelims, ...this.#handlers];
    for (let i = 0; i < handlers.length; i++) {
      try {
        const handler = handlers[i];
        const response = await handler.handle(req);
        if (response) {
          return response;
        }
      } catch (ex) {
        return Response.fromString(`Unhandled exception: ${ex}`, {
          statusCode: 500,
        });
      }
    }
    return Response.fromString("Not Found", { statusCode: 404 });
  }

  private _getHandler(a: string | RouteCallback, b: RouteCallback[]): Handler {
    const path = typeof a == "string" ? a : "*";
    const callbacks =
      typeof a == "string"
        ? b
        : (() => {
            b.unshift(a);
            return b;
          })();
    return new Handler(new Route(path), callbacks);
  }

  private async _processAfters(response: Response, request: Request) {
    await syncForEach(this.#afters, async (after: Afterware) => {
      response = await after(response, request);
    });
    return response;
  }

  public use(path: string, ...callbacks: RouteCallback[]): iRouter;
  public use(...callbacks: RouteCallback[]): iRouter;
  public use(a: string | RouteCallback, ...b: RouteCallback[]): iRouter {
    this.#prelims.push(this._getHandler(a, b));
    return this;
  }

  public route(path: string, ...callbacks: RouteCallback[]): Handler;
  public route(...callbacks: RouteCallback[]): Handler;
  public route(a: string | RouteCallback, ...b: RouteCallback[]): Handler {
    const handler = this._getHandler(a, b);
    this.#handlers.push(handler);
    return handler;
  }

  public routes(routes: {
    [path: string]: RouteCallback[] | RouteCallback;
  }): iRouter {
    for (const path in routes) {
      const cb = routes[path];
      const callbacks = Array.isArray(cb) ? cb : [cb];
      this.route.apply(this, [path, ...callbacks]);
    }
    return this;
  }

  public async handle(req: http.IncomingMessage, res?: http.ServerResponse) {
    const request = await this._parseRequest(req);
    const response = await this._getResponse(request);
    this._processAfters(response, request);
    if (res) {
      response.send(res);
    }
    return response;
  }

  public afterAll(...callbacks: Afterware[]) {
    callbacks.forEach((callback) => this.#afters.push(callback));
    return this;
  }
}
