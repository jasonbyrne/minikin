import * as http from "http";
import { Request } from "./request";
import { Response } from "./response";
import { RouteCallback, AfterCallback, iRouter } from "./interfaces";
import { syncForEach } from "./util";
import { Handler } from "./handler";
import { Afterware } from "./afterware";

export class Router implements iRouter {
  #prelims: Handler[] = [];
  #handlers: Handler[] = [];
  #afters: Afterware[] = [];

  public static async create() {
    return new Router();
  }

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

  private _overloaded(a: string | Function, b: Function[]) {
    const path = typeof a == "string" ? a : "*";
    const callbacks =
      typeof a == "string"
        ? b
        : (() => {
            b.unshift(a);
            return b;
          })();
    return { path: path, callbacks: callbacks };
  }

  private _getAfterware(
    a: string | AfterCallback,
    b: AfterCallback[]
  ): Afterware {
    const { path, callbacks } = this._overloaded(a, b);
    return new Afterware(path, callbacks as AfterCallback[]);
  }

  private _getHandler(a: string | RouteCallback, b: RouteCallback[]): Handler {
    const { path, callbacks } = this._overloaded(a, b);
    return new Handler(path, callbacks as RouteCallback[]);
  }

  private async _processAfters(response: Response, request: Request) {
    await syncForEach(this.#afters, async (after: Afterware) => {
      response = await after.execute(response, request);
    });
    return response;
  }

  public beforeAll = this.use;
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

  public afterAll(path: string, ...callbacks: AfterCallback[]): iRouter;
  public afterAll(...callbacks: AfterCallback[]): iRouter;
  public afterAll(a: string | AfterCallback, ...b: AfterCallback[]): iRouter {
    this.#afters.push(this._getAfterware(a, b));
    return this;
  }

  public async handle(req: http.IncomingMessage, res?: http.ServerResponse) {
    const request = await this._parseRequest(req);
    const response = await this._processAfters(
      await this._getResponse(request),
      request
    );
    if (res) {
      response.send(res);
    }
    return response;
  }
}
