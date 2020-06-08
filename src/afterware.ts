import { Route } from "./route";
import { Request } from "./request";
import { Response } from "./response";
import { AfterCallback } from "./interfaces";
import { syncForEach } from "./util";

export class Afterware extends Route {
  #callbacks: AfterCallback[];

  constructor(path: string, callbacks: AfterCallback[]) {
    super(path);
    this.#callbacks = callbacks;
  }

  public async execute(response: Response, request: Request) {
    if (this.matches(request)) {
      await syncForEach(this.#callbacks, async (after: AfterCallback) => {
        response = (await after(response, request)) || response;
      });
    }
    return response;
  }
}
