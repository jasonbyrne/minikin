import Route from "./route";
import Request from "./request";
import Response from "./response";
import { RouteCallback, AfterCallback } from "./interfaces";
import { firstResponse } from "./first-response";
import { text } from "./from-text";
import { syncForEach } from "./sync-foreach";

export default class Handler extends Route {
  #afters: AfterCallback[] = [];

  constructor(path: string, private _callbacks: RouteCallback[]) {
    super(path);
  }

  #parseParams(pathMatches: RegExpMatchArray, req: Request) {
    const params = this.uri.match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substring(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params.set(key, pathMatches[i + 1]);
      });
    }
  }

  async #processAfters(
    response: Response,
    request: Request,
    env?: any,
    ctx?: any
  ) {
    await syncForEach(this.#afters, async (after: AfterCallback) => {
      response = (await after(response, request, env, ctx)) || response;
    });
    return response;
  }

  public async handle(req: Request, env?: any, ctx?: any) {
    const matches = this.matches(req);
    if (matches) {
      this.#parseParams(matches, req);
      const myResponse = await firstResponse(req, this._callbacks, env, ctx);
      return this.#processAfters(
        myResponse || text("No content in response", { statusCode: 500 }),
        req,
        env,
        ctx
      );
    }
    return false;
  }

  public after(...callbacks: AfterCallback[]) {
    callbacks.forEach((callback) => this.#afters.push(callback));
    return this;
  }
}
