import { Route } from "./route";
import { Request } from "./request";
import { Response } from "./response";
import { RouteCallback } from "./interfaces";
import { firstResponse } from "./util";

export class Handler {
  #route: Route;
  #callbacks: RouteCallback[];

  constructor(route: Route, callbacks: RouteCallback[]) {
    this.#route = route;
    this.#callbacks = callbacks;
  }

  private _parseParams(pathMatches: RegExpMatchArray, req: Request) {
    const params = this.#route.uri.match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substr(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params[key] = pathMatches[i + 1];
      });
    }
  }

  private _getMatches(req: Request): RegExpMatchArray | false {
    return this.#route.matches(req);
  }

  public async handle(req: Request) {
    const matches = this._getMatches(req);
    if (matches) {
      this._parseParams(matches, req);
      const myResponse = await firstResponse(req, this.#callbacks);
      return (
        myResponse ||
        Response.fromString("No content in response", { statusCode: 500 })
      );
    }
    return false;
  }
}
