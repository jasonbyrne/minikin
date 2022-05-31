import {
  mapToObject,
  MinikinRequest,
  RouterInit,
  ProtoRouter,
} from "minikin-router";

export class EdgeRouter extends ProtoRouter {
  public async handle(
    req: Request,
    env: any,
    ctx: any
  ): Promise<Response | void> {
    const request = new MinikinRequest({
      url: req.url,
      method: req.method,
      headers: mapToObject(req.headers as unknown as Map<string, string>),
      body: await req.text(),
    });
    const response = await this._processRequest(request, env, ctx);
    const postResponse = await this._processAfters(response, request, env, ctx);
    if (!postResponse) return;
    return new Response(postResponse.content(), {
      headers: mapToObject(postResponse.headers),
      status: postResponse.status,
      statusText: postResponse.statusText,
    });
  }
}
export const createEdgeRouter = (opts?: RouterInit) => new EdgeRouter(opts);
