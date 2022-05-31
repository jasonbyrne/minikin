import {
  Router,
  mapToObject,
  MinikinRequest,
  RouterInit,
} from "minikin-router";

export const EdgeRouter = (opts?: RouterInit) => {
  const router = new Router(opts);

  return class EdgeRouter {
    public route = router.route;
    public routes = router.routes;
    public before = router.before;
    public use = router.use;
    public after = router.after;

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
      const response = await router.handle(request, env, ctx);
      if (!response) return;
      return new Response(response.content(), {
        headers: mapToObject(response.headers),
        status: response.status,
        statusText: response.statusText,
      });
    }
  };
};

export const createEdgeRouter = (opts?: RouterInit) => new (EdgeRouter(opts))();
