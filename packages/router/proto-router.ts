import MinikinRequest from "./request";
import MinikinResponse from "./response";
import {
  RouteCallback,
  AfterCallback,
  Routes,
  RouterInit,
  RouterInterface,
} from "./interfaces";
import { syncForEach } from "./sync-foreach";
import Handler from "./handler";
import Afterware from "./afterware";

export abstract class ProtoRouter implements RouterInterface {
  public readonly passThroughOnException: boolean;
  public readonly base: string;

  protected _prelims: Handler[] = [];
  protected _handlers: Handler[] = [];
  protected _afters: Afterware[] = [];

  public constructor(opts?: RouterInit) {
    if (opts?.routes) this.routes(opts?.routes);
    this.passThroughOnException = !!opts?.passThroughOnException;
    this.base = opts?.base || "";
  }

  protected async _processRequest(req: MinikinRequest, env: any, ctx: any) {
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

  protected _overloaded(a: string | Function, b: Function[]) {
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

  protected _getAfterware(
    a: string | AfterCallback,
    b: AfterCallback[]
  ): Afterware {
    const { path, callbacks } = this._overloaded(a, b);
    return new Afterware(path, callbacks as AfterCallback[]);
  }

  protected _getHandler(
    a: string | RouteCallback,
    b: RouteCallback[]
  ): Handler {
    const { path, callbacks } = this._overloaded(a, b);
    return new Handler(path, callbacks as RouteCallback[]);
  }

  protected async _processAfters(
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
  public use(path: string, ...callbacks: RouteCallback[]): RouterInterface;
  public use(...callbacks: RouteCallback[]): RouterInterface;
  public use(a: string | RouteCallback, ...b: RouteCallback[]) {
    this._prelims.push(this._getHandler(a, b));
    return this;
  }

  public route(...callbacks: RouteCallback[]): RouterInterface;
  public route(path: string, ...callbacks: RouteCallback[]): RouterInterface;
  public route(a: string | RouteCallback, ...b: RouteCallback[]) {
    this._handlers.push(this._getHandler(a, b));
    return this;
  }

  public routes(routes: Routes): RouterInterface {
    for (const path in routes) {
      const cb = routes[path];
      const callbacks = Array.isArray(cb) ? cb : [cb];
      this.route.apply(this, [path, ...callbacks]);
    }
    return this;
  }

  public after(path: string, ...callbacks: AfterCallback[]): RouterInterface;
  public after(...callbacks: AfterCallback[]): RouterInterface;
  public after(a: string | AfterCallback, ...b: AfterCallback[]) {
    this._afters.push(this._getAfterware(a, b));
    return this;
  }

  public abstract handle(req: any, env?: any, ctx?: any): Promise<any | void>;
}
