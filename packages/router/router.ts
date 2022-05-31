import MinikinRequest from "./request";
import MinikinResponse from "./response";
import { ProtoRouter } from "./proto-router";

export default class Router extends ProtoRouter {
  public async handle(
    request: MinikinRequest,
    env?: any,
    ctx?: any
  ): Promise<MinikinResponse | void> {
    const response = await this._processRequest(request, env, ctx);
    const postResponse = await this._processAfters(response, request, env, ctx);
    if (postResponse) return postResponse;
    if (!this.passThroughOnException) {
      return new MinikinResponse("Not Found", { status: 404 });
    }
  }
}
