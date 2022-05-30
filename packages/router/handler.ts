import Route from "./route";
import Request from "./request";
import Response from "./response";
import { RouteCallback, AfterCallback } from "./interfaces";
import { firstResponse, syncForEach } from "./util";

export default class Handler extends Route {
  #afters: AfterCallback[] = [];

  constructor(path: string, private _callbacks: RouteCallback[]) {
    super(path);
  }

  #parseParams(pathMatches: RegExpMatchArray, req: Request) {
    const params = this.uri.match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substr(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params[key] = pathMatches[i + 1];
      });
    }
  }

  async #processAfters(response: Response, request: Request) {
    await syncForEach(this.#afters, async (after: AfterCallback) => {
      response = (await after(response, request)) || response;
    });
    return response;
  }

  public async handle(req: Request) {
    const matches = this.matches(req);
    if (matches) {
      this.#parseParams(matches, req);
      const myResponse = await firstResponse(req, this._callbacks);
      return this.#processAfters(
        myResponse ||
          Response.fromString("No content in response", { statusCode: 500 }),
        req
      );
    }
    return false;
  }

  public after(...callbacks: AfterCallback[]) {
    callbacks.forEach((callback) => this.#afters.push(callback));
    return this;
  }
}