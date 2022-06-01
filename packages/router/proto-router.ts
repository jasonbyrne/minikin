import MinikinRequest from "./request";
import MinikinResponse from "./response";
import {
  RouteCallback,
  AfterCallback,
  Routes,
  RouterInit,
  RouterInterface,
} from "./interfaces";
import { syncForEach } from "./utils/sync-foreach";
import Handler from "./handler";
import Afterware from "./afterware";

export const processAfters = async (
  router: RouterInterface,
  response: MinikinResponse | null,
  request: MinikinRequest,
  env?: any,
  ctx?: any
) => {
  await syncForEach(router.callbacks.afters, async (after: Afterware) => {
    response = await after.execute(response, request, env, ctx);
  });
  return response;
};

export const processRequest = async (
  router: RouterInterface,
  req: MinikinRequest,
  env?: any,
  ctx?: any
) => {
  const handlers = [...router.callbacks.befores, ...router.callbacks.handlers];
  for (let i = 0; i < handlers.length; i++) {
    try {
      const handler = handlers[i];
      const response = await handler.execute(req, env, ctx);
      if (response) return response;
    } catch (ex) {
      if (!router.passThroughOnException) {
        return new MinikinResponse(`Unhandled exception: ${ex}`, {
          status: 500,
        });
      }
    }
  }
  return null;
};

const overloading = (
  router: RouterInterface,
  a: string | Function,
  b: Function[]
) => {
  const path = typeof a == "string" ? a : "*";
  const callbacks =
    typeof a == "string"
      ? b
      : (() => {
          b.unshift(a);
          return b;
        })();
  return { path: `${router.base}${path}`, callbacks: callbacks };
};

const getAfterware = (
  router: RouterInterface,
  a: string | AfterCallback,
  b: AfterCallback[]
): Afterware => {
  const { path, callbacks } = overloading(router, a, b);
  return new Afterware(path, callbacks as AfterCallback[]);
};

const getHandler = (
  router: RouterInterface,
  a: string | RouteCallback,
  b: RouteCallback[]
): Handler => {
  const { path, callbacks } = overloading(router, a, b);
  return new Handler(path, callbacks as RouteCallback[]);
};

class RouterCallbacks {
  public readonly befores: Handler[] = [];
  public readonly handlers: Handler[] = [];
  public readonly afters: Afterware[] = [];
}

export abstract class ProtoRouter implements RouterInterface {
  public readonly passThroughOnException: boolean;
  public readonly base: string;
  public readonly callbacks = new RouterCallbacks();

  public constructor(opts?: RouterInit) {
    if (opts?.routes) this.routes(opts?.routes);
    this.passThroughOnException = !!opts?.passThroughOnException;
    this.base = opts?.base || "";
  }

  public use(path: string, ...callbacks: RouteCallback[]): RouterInterface;
  public use(...callbacks: RouteCallback[]): RouterInterface;
  public use(a: string | RouteCallback, ...b: RouteCallback[]) {
    this.callbacks.befores.push(getHandler(this, a, b));
    return this;
  }

  public route(...callbacks: RouteCallback[]): RouterInterface;
  public route(path: string, ...callbacks: RouteCallback[]): RouterInterface;
  public route(a: string | RouteCallback, ...b: RouteCallback[]) {
    this.callbacks.handlers.push(getHandler(this, a, b));
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
    this.callbacks.afters.push(getAfterware(this, a, b));
    return this;
  }

  public abstract handle(req: any, env?: any, ctx?: any): Promise<any | void>;
}
