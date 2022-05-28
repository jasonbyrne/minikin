import * as http from "http";
import MRequest from "./request";
import MResponse from "./response";
import { RouteCallback, AfterCallback, iRouter } from "./interfaces";
import { interableToKeyValue, syncForEach } from "./util";
import Handler from "./handler";
import Afterware from "./afterware";
import parseRequest from "./parse-request";

export default class Router implements iRouter {
  #prelims: Handler[] = [];
  #handlers: Handler[] = [];
  #afters: Afterware[] = [];

  public static create() {
    return new Router();
  }

  async #getResponse(req: MRequest): Promise<MResponse> {
    const handlers = [...this.#prelims, ...this.#handlers];
    for (let i = 0; i < handlers.length; i++) {
      try {
        const handler = handlers[i];
        const response = await handler.handle(req);
        if (response) {
          return response;
        }
      } catch (ex) {
        return MResponse.fromString(`Unhandled exception: ${ex}`, {
          statusCode: 500,
        });
      }
    }
    return MResponse.fromString("Not Found", { statusCode: 404 });
  }

  #overloaded(a: string | Function, b: Function[]) {
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

  #getAfterware(a: string | AfterCallback, b: AfterCallback[]): Afterware {
    const { path, callbacks } = this.#overloaded(a, b);
    return new Afterware(path, callbacks as AfterCallback[]);
  }

  #getHandler(a: string | RouteCallback, b: RouteCallback[]): Handler {
    const { path, callbacks } = this.#overloaded(a, b);
    return new Handler(path, callbacks as RouteCallback[]);
  }

  async #processAfters(response: MResponse, request: MRequest) {
    await syncForEach(this.#afters, async (after: Afterware) => {
      response = await after.execute(response, request);
    });
    return response;
  }

  public beforeAll = this.use;
  public use(path: string, ...callbacks: RouteCallback[]): iRouter;
  public use(...callbacks: RouteCallback[]): iRouter;
  public use(a: string | RouteCallback, ...b: RouteCallback[]): iRouter {
    this.#prelims.push(this.#getHandler(a, b));
    return this;
  }

  public route(...callbacks: RouteCallback[]): Handler;
  public route(path: string, ...callbacks: RouteCallback[]): Handler;
  public route(a: string | RouteCallback, ...b: RouteCallback[]): Handler {
    const handler = this.#getHandler(a, b);
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
    this.#afters.push(this.#getAfterware(a, b));
    return this;
  }

  public async handle(req: http.IncomingMessage, res?: http.ServerResponse) {
    const request = await parseRequest(req);
    const initialResponse = await this.#getResponse(request);
    const response = await this.#processAfters(initialResponse, request);
    if (res) response.send(res);
    return response;
  }

  public async serviceWorker(req: Request) {
    const request = new MRequest({
      method: req.method,
      url: req.url,
      headers: interableToKeyValue(req.headers.entries()),
      trailers: {},
      body: await req.text(),
    });
    const initialResponse = await this.#getResponse(request);
    const response = await this.#processAfters(initialResponse, request);
    return response.forServiceWorker();
  }
}
