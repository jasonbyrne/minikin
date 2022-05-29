import { Router } from "minikin-router";
import Server from "./server";

export { Server };
export * from "minikin-router";

export default class Minikin {
  server = Server.listen;
  router = Router.create;
}
