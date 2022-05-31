import MinikinRequest from "./request";
import MinikinResponse from "./response";
import Router from "./router";
import Handler from "./handler";
import Route from "./route";
import Afterware from "./afterware";
import { json } from "./from-json";
import { text } from "./from-text";
import { redirect } from "./redirect";
import { RouterInit } from "./interfaces";
import { ProtoRouter } from "./proto-router";

export {
  Router,
  ProtoRouter,
  MinikinRequest,
  MinikinResponse,
  Route,
  Handler,
  Afterware,
  json,
  text,
  redirect,
};
export * from "./interfaces";
export * from "./object-to-map";
export * from "./map-to-object";

const router = (opts?: RouterInit) => new Router(opts);
export default router;
