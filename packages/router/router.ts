import MinikinRequest from "./request";
import MinikinResponse from "./response";
import Handler from "./handler";
import Afterware from "./afterware";
import { AfterCallback, RouteCallback, RouterInit, Routes } from "./interfaces";
import { mapToObject } from "./utils/map-to-object";
import { syncForEach } from "./utils/sync-foreach";

export default class Router {
  public readonly passThroughOnException: boolean;
  public readonly base: string;
  private befores: Handler[] = [];
  private handlers: Handler[] = [];
  private afters: Afterware[] = [];

  public constructor(opts?: RouterInit) {
    if (opts?.routes) this.routes(opts?.routes);
    this.passThroughOnException = !!opts?.passThroughOnException;
    this.base = opts?.base || "";
  }

  private async processAfters(
    response: MinikinResponse | null,
    request: MinikinRequest,
    env?: any,
    ctx?: any
  ) {
    await syncForEach(this.afters, async (after: Afterware) => {
      response = await after.execute(response, request, env, ctx);
    });
    return response;
  }

  private async processRequest(req: MinikinRequest, env?: any, ctx?: any) {
    const handlers = [...this.befores, ...this.handlers];
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

  private overloading(a: string | Function, b: Function[]) {
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

  private getHandler(a: string | RouteCallback, b: RouteCallback[]): Handler {
    const { path, callbacks } = this.overloading(a, b);
    return new Handler(path, callbacks as RouteCallback[]);
  }

  private getAfterware(
    a: string | AfterCallback,
    b: AfterCallback[]
  ): Afterware {
    const { path, callbacks } = this.overloading(a, b);
    return new Afterware(path, callbacks as AfterCallback[]);
  }

  public use(path: string, ...callbacks: RouteCallback[]): Router;
  public use(...callbacks: RouteCallback[]): Router;
  public use(a: string | RouteCallback, ...b: RouteCallback[]) {
    this.befores.push(this.getHandler(a, b));
    return this;
  }

  public route(...callbacks: RouteCallback[]): Router;
  public route(path: string, ...callbacks: RouteCallback[]): Router;
  public route(a: string | RouteCallback, ...b: RouteCallback[]) {
    this.handlers.push(this.getHandler(a, b));
    return this;
  }

  public routes(routes: Routes): Router {
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
    this.afters.push(this.getAfterware(a, b));
    return this;
  }

  public async handle(request: MinikinRequest): Promise<MinikinResponse | void>;
  public async handle(
    req: Request,
    env: any,
    ctx: any
  ): Promise<Response | void>;
  public async handle(
    req: MinikinRequest | Request,
    env?: any,
    ctx?: any
  ): Promise<Response | MinikinResponse | void> {
    if (req instanceof MinikinRequest) return this.handleHttp(req);
    return this.handleEdge(req, env, ctx);
  }

  private async handleHttp(
    request: MinikinRequest
  ): Promise<MinikinResponse | void> {
    const response = await this.processRequest(request);
    const postResponse = await this.processAfters(response, request);
    if (postResponse) return postResponse;
    if (!this.passThroughOnException) {
      return new MinikinResponse("Not Found", { status: 404 });
    }
  }

  private async handleEdge(
    req: Request,
    env: any,
    ctx: any
  ): Promise<Response | void> {
    const request = new MinikinRequest({
      url: req.url,
      method: req.method,
      headers: mapToObject(req.headers as unknown as Map<string, string>),
      body: await req.text(),
    });
    const response = await this.processRequest(request, env, ctx);
    const postResponse = await this.processAfters(response, request, env, ctx);
    if (!postResponse) return;
    return new Response(postResponse.content(), {
      headers: mapToObject(postResponse.headers),
      status: postResponse.status,
      statusText: postResponse.statusText,
    });
  }
}
