import { ServerInit } from "./interfaces";
import Server from "./server";

export { Server };
export * from "minikin-router";
export * from "./from-binary";
export * from "./from-file";
export * from "./from-template";

const server = (portNumber?: number, opts?: ServerInit) =>
  Server.listen(portNumber, opts);
export default server;
