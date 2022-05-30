import MinikinRequest from "./request";
import MinikinResponse from "./response";
import { RouteCallback, AfterCallback, Routes } from "./interfaces";
import { syncForEach } from "./util";
import Handler from "./handler";
import Afterware from "./afterware";

export default class Router {
  #prelims: Handler[] = [];
  #handlers: Handler[] = [];
  #afters: Afterware[] = [];

  public constructor(routes?: Routes) {
    if (routes) this.routes(routes);
  }

  async #getResponse(req: MinikinRequest): Promise<MinikinResponse> {
    const handlers = [...this.#prelims, ...this.#handlers];
    for (let i = 0; i < handlers.length; i++) {
      try {
        const handler = handlers[i];
        const response = await handler.handle(req);
        if (response) {
          return response;
        }
      } catch (ex) {
        return new MinikinResponse(`Unhandled exception: ${ex}`, {
          statusCode: 500,
        });
      }
    }
    return new MinikinResponse("Not Found", { statusCode: 404 });
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

  async #processAfters(response: MinikinResponse, request: MinikinRequest) {
    await syncForEach(this.#afters, async (after: Afterware) => {
      response = await after.execute(response, request);
    });
    return response;
  }

  public beforeAll = this.use;
  public use(path: string, ...callbacks: RouteCallback[]): Router;
  public use(...callbacks: RouteCallback[]): Router;
  public use(a: string | RouteCallback, ...b: RouteCallback[]) {
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

  public routes(routes: Routes) {
    for (const path in routes) {
      const cb = routes[path];
      const callbacks = Array.isArray(cb) ? cb : [cb];
      this.route.apply(this, [path, ...callbacks]);
    }
    return this;
  }

  public afterAll(path: string, ...callbacks: AfterCallback[]): Router;
  public afterAll(...callbacks: AfterCallback[]): Router;
  public afterAll(a: string | AfterCallback, ...b: AfterCallback[]) {
    this.#afters.push(this.#getAfterware(a, b));
    return this;
  }

  public async handle(request: MinikinRequest) {
    const initialResponse = await this.#getResponse(request);
    return this.#processAfters(initialResponse, request);
  }
}
