import MinikinRequest from "./request";
import MinikinResponse from "./response";
import Router from "./router";
import Handler from "./handler";
import Route from "./route";
import Afterware from "./afterware";
import { json } from "./utils/from-json";
import { text } from "./utils/from-text";
import { redirect } from "./utils/redirect";
import { RouterInit } from "./interfaces";
import { ProtoRouter, processAfters, processRequest } from "./proto-router";

export {
  Router,
  MinikinRequest,
  MinikinResponse,
  Route,
  Handler,
  Afterware,
  json,
  text,
  redirect,
  ProtoRouter,
  processAfters,
  processRequest,
};
export * from "./interfaces";
export * from "./utils/object-to-map";
export * from "./utils/map-to-object";
export * from "./utils/map-to-object";

const router = (opts?: RouterInit) => new Router(opts);
export default router;
