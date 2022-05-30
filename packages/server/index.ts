import * as https from "https";
import Server from "./server";

export { Server };
export * from "minikin-router";
export * from "./from-binary";
export * from "./from-file";
export * from "./from-template";

const server = (portNumber?: number, opts?: https.ServerOptions) =>
  Server.listen(portNumber, opts);
export default server;
