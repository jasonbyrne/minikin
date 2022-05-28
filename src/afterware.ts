import Route from "./route";
import Request from "./request";
import Response from "./response";
import { AfterCallback } from "./interfaces";
import { syncForEach } from "./util";

export default class Afterware extends Route {
  constructor(path: string, private _callbacks: AfterCallback[]) {
    super(path);
  }

  public async execute(response: Response, request: Request) {
    if (this.matches(request)) {
      await syncForEach(this._callbacks, async (after: AfterCallback) => {
        response = (await after(response, request)) || response;
      });
    }
    return response;
  }
}
