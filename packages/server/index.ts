import * as https from "https";
import Server from "./server";

export { Server };
export * from "minikin-router";

const server = (portNumber?: number, opts?: https.ServerOptions) =>
  Server.listen(portNumber, opts);
export default server;
