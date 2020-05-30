import * as http from "http";
import * as https from "https";
import { RouteCallback } from "./handler";
import { HttpMethod, Request } from "./request";
import { Response } from "./response";

const asyncFirstResponse = (
  req: Request,
  arr: RouteCallback[]
): Promise<Response> => {
  return new Promise(async (resolve) => {
    let res: Response | null = null;
    for (let i = 0; i < arr.length; i++) {
      if (!res) {
        res = (await arr[i](req)) || null;
      }
    }
    resolve(
      res === null
        ? Response.createFromString("No response", { statusCode: 500 })
        : res
    );
  });
};

export class Server {
  private _httpPort: number = 3000;
  private _server: http.Server | https.Server;
  private _handlers: [HttpMethod, string, RouteCallback[]][];

  public get isListening(): boolean {
    return this._server.listening;
  }

  public static async create(
    port: number,
    opts?: https.ServerOptions
  ): Promise<Server> {
    const server = new Server(port, opts);
    await server._listen();
    return server;
  }

  private constructor(port: number, secureOpts?: https.ServerOptions) {
    const listener = (req: http.IncomingMessage, res: http.ServerResponse) => {
      this._requestHandler(req, res);
    };
    this._httpPort = port;
    this._server = secureOpts
      ? https.createServer(secureOpts, listener)
      : http.createServer(listener);
    this._handlers = [];
  }

  private async _parseRequest(req: http.IncomingMessage): Promise<Request> {
    return new Promise((resolve) => {
      const chunks: any[] = [];
      req
        .on("data", (chunk: any) => {
          chunks.push(chunk);
        })
        .on("end", () => {
          resolve({
            body: Buffer.concat(chunks).toString(),
            url: req.url || "/",
            headers: req.headers,
            method: (req.method?.toUpperCase() || "GET") as HttpMethod,
            params: {},
          });
        });
    });
  }

  private async _handle(
    myReq: Request,
    res: http.ServerResponse
  ): Promise<boolean> {
    // Loop through all of our handlers
    for (let i = 0; i < this._handlers.length; i++) {
      const handler = this._handlers[i];
      // See if the path and method match one of them
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
      const pathMatches = myReq.url?.match(regexPath);
      if (myReq.method == handler[0] && pathMatches) {
        // Parse params from route
        const params = handler[1].match(/\/:([a-z]+)/gi)?.map((key) => {
          return key.substr(2);
        });
        if (pathMatches.length > 1 && params && params.length > 0) {
          params.forEach((key, i) => {
            myReq.params[key] = pathMatches[i + 1];
          });
        }
        try {
          // Get response from handler
          const myResponse = await asyncFirstResponse(myReq, handler[2]);
          // Send a response
          this._sendResponse(
            res,
            myResponse ||
              Response.createFromJson(
                {
                  message: "No content in response",
                },
                { statusCode: 500 }
              )
          );
        } catch (ex) {
          this._sendResponse(
            res,
            Response.createFromJson(
              {
                message: `Unhandled exception`,
                details: ex,
              },
              { statusCode: 500 }
            )
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
      Response.createFromJson({ message: "Not Found" }, { statusCode: 404 })
    );
  }

  private _sendResponse(res: http.ServerResponse, mr: Response) {
    res.writeHead(mr.statusCode, mr.statusMessage, mr.headers);
    res.end(mr.content);
  }

  private _listen(): Promise<void> {
    if (this.isListening) {
      throw new Error("HTTP Server is already listening.");
    }
    return new Promise((resolve, reject) => {
      this._server
        .listen({ port: this._httpPort }, () => {
          resolve();
        })
        .on("error", (err: string) => {
          if (err) {
            return reject(`Could not listen on port ${this._httpPort}: ${err}`);
          }
        });
    });
  }

  public route(
    method: HttpMethod,
    path: string,
    ...callbacks: RouteCallback[]
  ): Server {
    this._handlers.push([method, path, callbacks]);
    return this;
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.isListening
        ? this._server.close((err) => {
            err ? reject(err) : resolve();
          })
        : resolve();
    });
  }
}
