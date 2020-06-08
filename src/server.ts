import * as http from "http";
import * as https from "https";
import { Router } from "./router";
import { iServer } from "./interfaces";

export class Server extends Router implements iServer {
  #server: http.Server | https.Server;

  public static async listen(port: number, opts?: https.ServerOptions) {
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

  public async close(): Promise<iServer> {
    return new Promise((resolve, reject) => {
      this.#server.listening
        ? this.#server.close((err) => (err ? reject(err) : resolve()))
        : resolve(this);
    });
  }
}
