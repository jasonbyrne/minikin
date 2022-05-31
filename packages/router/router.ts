import MinikinRequest from "./request";
import MinikinResponse from "./response";
import { RouteCallback, AfterCallback, Routes, RouterInit } from "./interfaces";
import { syncForEach } from "./sync-foreach";
import Handler from "./handler";
import Afterware from "./afterware";

export default class Router {
  public readonly passThroughOnException: boolean;
  public readonly base: string;

  private _prelims: Handler[] = [];
  private _handlers: Handler[] = [];
  private _afters: Afterware[] = [];

  public constructor(opts?: RouterInit) {
    if (opts?.routes) this.routes(opts?.routes);
    this.passThroughOnException = !!opts?.passThroughOnException;
    this.base = opts?.base || "";
  }

  private async _processRequest(req: MinikinRequest, env: any, ctx: any) {
    const handlers = [...this._prelims, ...this._handlers];
    for (let i = 0; i < handlers.length; i++) {
      try {
        const handler = handlers[i];
        const response = await handler.execute(req, env, ctx);
        if (response) return response;
      } catch (ex) {
        if (!this.passThroughOnException) {
          return new MinikinResponse(`Unhandled exception: ${ex}`, {
            status: 500,
          });
        }
      }
    }
    return null;
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
    return { path: `${this.base}${path}`, callbacks: callbacks };
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

  private async _processAfters(
    response: MinikinResponse | null,
    request: MinikinRequest,
    env: any,
    ctx: any
  ) {
    await syncForEach(this._afters, async (after: Afterware) => {
      response = await after.execute(response, request, env, ctx);
    });
    return response;
  }

  public before = this.use;
  public use(path: string, ...callbacks: RouteCallback[]): Router;
  public use(...callbacks: RouteCallback[]): Router;
  public use(a: string | RouteCallback, ...b: RouteCallback[]) {
    this._prelims.push(this._getHandler(a, b));
    return this;
  }

  public route(...callbacks: RouteCallback[]): Router;
  public route(path: string, ...callbacks: RouteCallback[]): Router;
  public route(a: string | RouteCallback, ...b: RouteCallback[]) {
    this._handlers.push(this._getHandler(a, b));
    return this;
  }

  public routes(routes: Routes) {
    for (const path in routes) {
      const cb = routes[path];
      const callbacks = Array.isArray(cb) ? cb : [cb];
      this.route.apply(this, [path, ...callbacks]);
    }
    return this;
  }

  public after(path: string, ...callbacks: AfterCallback[]): Router;
  public after(...callbacks: AfterCallback[]): Router;
  public after(a: string | AfterCallback, ...b: AfterCallback[]) {
    this._afters.push(this._getAfterware(a, b));
    return this;
  }

  public async handle(
    request: MinikinRequest,
    env?: any,
    ctx?: any
  ): Promise<MinikinResponse | void> {
    const response = await this._processRequest(request, env, ctx);
    const postResponse = await this._processAfters(response, request, env, ctx);
    if (postResponse) return postResponse;
    if (!this.passThroughOnException) {
      return new MinikinResponse("Not Found", { status: 404 });
    }
  }
}
