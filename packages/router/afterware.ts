import Route from "./route";
import Request from "./request";
import Response from "./response";
import { AfterCallback } from "./interfaces";
import { syncForEach } from "./sync-foreach";

export default class Afterware extends Route {
  constructor(path: string, private _callbacks: AfterCallback[]) {
    super(path);
  }

  public async execute(
    response: Response,
    request: Request,
    env?: any,
    ctx?: any
  ) {
    if (this.matches(request)) {
      await syncForEach(this._callbacks, async (after: AfterCallback) => {
        response = (await after(response, request, env, ctx)) || response;
      });
    }
    return response;
  }
}
