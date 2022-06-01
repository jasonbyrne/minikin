import {
  mapToObject,
  MinikinRequest,
  RouterInit,
  ProtoRouter,
  processRequest,
  processAfters,
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
    const response = await processRequest(this, request, env, ctx);
    const postResponse = await processAfters(this, response, request, env, ctx);
    if (!postResponse) return;
    return new Response(postResponse.content(), {
      headers: mapToObject(postResponse.headers),
      status: postResponse.status,
      statusText: postResponse.statusText,
    });
  }
}
export const createEdgeRouter = (opts?: RouterInit) => new EdgeRouter(opts);
