import Route from "./route";
import Request from "./request";
import { RouteCallback } from "./interfaces";
import { firstResponse } from "./first-response";

export default class Handler extends Route {
  constructor(path: string, private callbacks: RouteCallback[]) {
    super(path);
  }

  #parseParams(pathMatches: RegExpMatchArray, req: Request) {
    const params = this.url.match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substring(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params.set(key, pathMatches[i + 1]);
      });
    }
  }

  public async execute(req: Request, env?: any, ctx?: any) {
    const matches = this.matches(req);
    if (!matches) return null;
    this.#parseParams(matches, req);
    return firstResponse(req, this.callbacks, env, ctx);
  }
}
