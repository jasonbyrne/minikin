import * as http from "http";
import * as https from "https";
import { Response } from "./response";
import { Router } from "./router";
import { iServer } from "./interfaces";
import { RouteCallback } from ".";

export class Server implements iServer {
  #server: http.Server | https.Server;
  #router: Router;

  public static async listen(port: number, opts?: https.ServerOptions) {
    return new Server(opts)._listen(port);
  }

  private constructor(secureOpts?: https.ServerOptions) {
    const listener = (req: http.IncomingMessage, res: http.ServerResponse) =>
      this.handle(req, res);
    this.#server = secureOpts
      ? https.createServer(secureOpts, listener)
      : http.createServer(listener);
    this.#router = Router.create();
  }

  private _sendResponse(res: http.ServerResponse, mr: Response) {
    res.writeHead(mr.code, mr.message, mr.headers).write(mr.content, () => {
      res.addTrailers(mr.trailers);
      res.end();
    });
    return mr;
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

  public use(path: string, ...callbacks: RouteCallback[]): iServer;
  public use(...callbacks: RouteCallback[]): iServer;
  public use(): iServer {
    this.#router.use.apply(this.#router, arguments);
    return this;
  }

  public route(path: string, ...callbacks: RouteCallback[]): iServer;
  public route(...callbacks: RouteCallback[]): iServer;
  public route(): iServer {
    this.#router.route.apply(this.#router, arguments);
    return this;
  }

  public async handle(req: http.IncomingMessage, res: http.ServerResponse) {
    return this._sendResponse(res, await this.#router.handle(req));
  }

  public async close(): Promise<Server> {
    return new Promise((resolve, reject) => {
      this.#server.listening
        ? this.#server.close((err) => (err ? reject(err) : resolve()))
        : resolve(this);
    });
  }
}
