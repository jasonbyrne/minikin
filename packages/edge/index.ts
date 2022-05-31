import { Router, mapToObject, MinikinRequest } from "minikin-router";

/**
 * 
export default {
  fetch: router.handle,
};
 */

export default class EdgeRouter {
  private router = new Router();

  public route = this.router.route;
  public routes = this.router.routes;
  public before = this.router.before;
  public use = this.router.use;
  public after = this.router.after;

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
    const response = await this.router.handle(request, env, ctx);
    if (!response) return;
    return new Response(response.content(), {
      headers: mapToObject(response.headers),
      status: response.status,
      statusText: response.statusText,
    });
  }
}
