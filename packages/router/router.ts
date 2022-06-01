import MinikinRequest from "./request";
import MinikinResponse from "./response";
import { processAfters, processRequest, ProtoRouter } from "./proto-router";

export default class Router extends ProtoRouter {
  public async handle(
    request: MinikinRequest
  ): Promise<MinikinResponse | void> {
    const response = await processRequest(this, request);
    const postResponse = await processAfters(this, response, request);
    if (postResponse) return postResponse;
    if (!this.passThroughOnException) {
      return new MinikinResponse("Not Found", { status: 404 });
    }
  }
}
