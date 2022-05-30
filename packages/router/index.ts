import MinikinRequest from "./request";
import MinikinResponse from "./response";
import Router from "./router";
import Handler from "./handler";
import Route from "./route";
import Afterware from "./afterware";
import { json } from "./from-json";
import { text } from "./from-text";

export {
  Router,
  MinikinRequest,
  MinikinResponse,
  Route,
  Handler,
  Afterware,
  json,
  text,
};
export * from "./interfaces";
export * from "./object-to-map";
export * from "./map-to-object";

const router = () => new Router();
export default router;
