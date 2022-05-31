import * as http from "http";
import * as https from "https";
import { Router, mapToObject, RouterInit } from "minikin-router";
import { ServerInit } from "./interfaces";
import parseRequest from "./parse-request";
import Port from "./port";

export default class Server extends Router {
  private _server: http.Server | https.Server;
  private _port: number | null = null;

  public static async listen(
    portNumber?: number,
    opts?: ServerInit
  ): Promise<Server>;
  public static async listen(opts: https.ServerOptions): Promise<Server>;
  public static async listen(
    a?: number | (https.ServerOptions & RouterInit),
    b?: https.ServerOptions & RouterInit
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

  private constructor(opts?: ServerInit) {
    super(opts);
    const listener = async (
      req: http.IncomingMessage,
      res: http.ServerResponse
    ) => {
      const request = await parseRequest(req);
      const response = await this.handle(request);
      if (!response) {
        res.end();
        return;
      }
      res
        .writeHead(
          response.status,
          response.statusText,
          mapToObject(response.headers)
        )
        .write(response.content(), () => {
          res.addTrailers(mapToObject(response.trailers));
          res.end();
        });
    };
    this._server = opts
      ? https.createServer(opts, listener)
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
