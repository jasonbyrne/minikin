import * as http from "http";
import * as https from "https";
import { Router } from "./router";
import Port from "./port";

export class Server extends Router {
  private _server: http.Server | https.Server;
  private _port: number | null = null;

  public static async listen(
    portNumber?: number,
    opts?: https.ServerOptions
  ): Promise<Server>;
  public static async listen(opts: https.ServerOptions): Promise<Server>;
  public static async listen(
    a?: number | https.ServerOptions,
    b?: https.ServerOptions
  ) {
    let port = typeof a == "number" ? a : null;
    const opts = typeof a == "number" ? b : a;
    if (port === null) {
      port = await Port.next();
      if (!port) throw "No available port found.";
    } else {
      await Port.check(port);
    }
    return new Server(opts)._listen(port);
  }

  public get port(): number {
    return this._port || 0;
  }

  private constructor(secureOpts?: https.ServerOptions) {
    super();
    const listener = (req: http.IncomingMessage, res: http.ServerResponse) =>
      this.handle(req, res);
    this._server = secureOpts
      ? https.createServer(secureOpts, listener)
      : http.createServer(listener);
  }

  private _listen(port: number): Promise<Server> {
    if (this._server.listening) {
      throw new Error("HTTP Server is already listening.");
    }
    return new Promise((resolve, reject) => {
      this._server
        .listen({ port: port }, () => {
          this._port = port;
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
      this._server.listening
        ? this._server.close((err) => (err ? reject(err) : resolve(this)))
        : resolve(this);
    });
  }
}
