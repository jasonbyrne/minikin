import * as http from "http";
import * as https from "https";
import { Request } from "./request";
import { Response } from "./response";
import { RouteCallback, Handler } from "./interfaces";

const asyncFirstResponse = async (req: Request, arr: RouteCallback[]) => {
  let res: Response | null = null;
  for (let i = 0; i < arr.length; i++) {
    if (!res) {
      res = (await arr[i](req)) || null;
    }
  }
  return res === null
    ? Response.fromString("No response", { statusCode: 500 })
    : res;
};

export class Server {
  #server: http.Server | https.Server;
  #handlers: Handler[];

  public static async listen(port: number, opts?: https.ServerOptions) {
    return new Server(opts)._listen(port);
  }

  private constructor(secureOpts?: https.ServerOptions) {
    const listener = (req: http.IncomingMessage, res: http.ServerResponse) =>
      this._requestHandler(req, res);
    this.#server = secureOpts
      ? https.createServer(secureOpts, listener)
      : http.createServer(listener);
    this.#handlers = [];
  }

  private async _parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((resolve) => {
      const chunks: any[] = [];
      req
        .on("data", (chunk: any) => {
          chunks.push(chunk);
        })
        .on("end", () => {
          resolve(
            new Request({
              body: Buffer.concat(chunks).toString(),
              url: req.url || "/",
              headers: req.headers,
              trailers: req.trailers,
              method: req.method?.toUpperCase() || "GET",
              params: {},
            })
          );
        });
    });
  }

  private _pathMatches(handler: Handler, req: Request) {
    const regexPath =
      handler[1] === "*"
        ? new RegExp(".*")
        : new RegExp(
            "^" +
              handler[1]
                .replace(/\/:[A-Za-z]+/g, "/([^/]+)")
                .replace(/\/\*/, "/.*") +
              "$"
          );
    return req.url?.match(regexPath);
  }

  private _methodMatches(handler: Handler, req: Request) {
    const methods = handler[0].split("|");
    return methods.includes(req.method) || methods.includes("*");
  }

  private _parseParams(
    handler: Handler,
    pathMatches: RegExpMatchArray,
    req: Request
  ) {
    const params = handler[1].match(/\/:([a-z]+)/gi)?.map((key) => {
      return key.substr(2);
    });
    if (pathMatches.length > 1 && params && params.length > 0) {
      params.forEach((key, i) => {
        req.params[key] = pathMatches[i + 1];
      });
    }
  }

  private async _handle(
    myReq: Request,
    res: http.ServerResponse
  ): Promise<boolean> {
    for (let i = 0; i < this.#handlers.length; i++) {
      const handler = this.#handlers[i];
      const pathMatches = this._pathMatches(handler, myReq);
      const methodMathces = this._methodMatches(handler, myReq);
      if (methodMathces && pathMatches) {
        this._parseParams(handler, pathMatches, myReq);
        try {
          const myResponse = await asyncFirstResponse(myReq, handler[2]);
          this._sendResponse(
            res,
            myResponse ||
              Response.fromString("No content in response", { statusCode: 500 })
          );
        } catch (ex) {
          this._sendResponse(
            res,
            Response.fromString(`Unhandled exception: ${ex}`, {
              statusCode: 500,
            })
          );
        }
        return true;
      }
    }
    return false;
  }

  private async _requestHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const myReq = await this._parseRequest(req);
    await this._handle(myReq, res);
    this._sendResponse(
      res,
      Response.fromString("Not Found", { statusCode: 404 })
    );
  }

  private _sendResponse(res: http.ServerResponse, mr: Response) {
    res
      .writeHead(mr.statusCode, mr.statusMessage, mr.headers)
      .write(mr.content, () => {
        res.addTrailers(mr.trailers);
        res.end();
      });
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

  public route(path: string, ...callbacks: RouteCallback[]): Server {
    const arrPath = (() => {
      const arr = (path.trim() || "*").replace(/  +/g, " ").split(" ");
      return arr.length > 1 ? arr : ["*", arr[0]];
    })();
    const method = arrPath.length > 1 ? arrPath[0].toUpperCase() : "GET";
    const uri = arrPath[arrPath.length > 1 ? 1 : 0];
    this.#handlers.push([method, uri, callbacks]);
    return this;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.#server.listening
        ? this.#server.close((err) => {
            err ? reject(err) : resolve();
          })
        : resolve();
    });
  }
}
