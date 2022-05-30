import Request from "./request";
import Response from "./response";
import Router from "./router";
import Handler from "./handler";
import Route from "./route";
import Afterware from "./afterware";

export { Router, Response, Request, Route, Handler, Afterware };

const router = () => new Router();
export default router;
