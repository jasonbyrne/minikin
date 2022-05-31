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
    res: Response | null,
    req: Request,
    env?: any,
    ctx?: any
  ) {
    if (!this.matches(req)) return res;
    await syncForEach(this._callbacks, async (after: AfterCallback) => {
      res = (await after(res, req, env, ctx)) || res;
    });
    return res;
  }
}
