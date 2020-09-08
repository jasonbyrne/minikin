import * as http from "http";
import * as https from "https";
import { Router } from "./router";
import Port from "./port";

export class Server extends Router {
  #server: http.Server | https.Server;

  public static async listen(
    port: number | null = null,
    opts?: https.ServerOptions
  ) {
    if (port === null) {
      port = await Port.next();
      if (!port) throw "No available port found.";
    } else {
      await Port.check(port);
    }
    return new Server(opts)._listen(port);
  }

  private constructor(secureOpts?: https.ServerOptions) {
    super();
    const listener = (req: http.IncomingMessage, res: http.ServerResponse) =>
      this.handle(req, res);
    this.#server = secureOpts
      ? https.createServer(secureOpts, listener)
      : http.createServer(listener);
  }

  private _listen(port: number): Promise<Server> {
    if (this.#server.listening) {
      throw new Error("HTTP Server is already listening.");
    }
    return new Promise((resolve, reject) => {
      this.#server
        .listen({ port: port }, () => {
          resolve(this);
        })
        .on("error", (err: string) => {
          if (err) {
            return reject(`Could not listen on port ${port}: ${err}`);
          }
        });
    });
  }

  public close(): Promise<Server> {
    return new Promise((resolve, reject) => {
      this.#server.listening
        ? this.#server.close((err) => (err ? reject(err) : resolve()))
        : resolve(this);
    });
  }
}
