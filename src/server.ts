import * as http from "http";
import { MinikinRouteCallback } from "./handler";
import { HttpMethod, MinikinRequest } from "./request";
import { MinikinResponse } from "./response";

export class MinikinServer {
  private _httpPort: number = 3000;
  private _server: http.Server;
  private _handlers: [HttpMethod, string, MinikinRouteCallback][];

  public get isListening(): boolean {
    return this._server.listening;
  }

  public static async create(port: number): Promise<MinikinServer> {
    const server = new MinikinServer(port);
    await server._listen();
    return server;
  }

  private constructor(port: number) {
    this._httpPort = port;
    this._server = http.createServer((req, res) => {
      this._requestHandler(req, res);
    });
    this._handlers = [];
  }

  private async _parseRequest(
    req: http.IncomingMessage
  ): Promise<MinikinRequest> {
    return new Promise((resolve) => {
      const chunks: any[] = [];
      req
        .on("data", (chunk: any) => {
          chunks.push(chunk);
        })
        .on("end", () => {
          const body = Buffer.concat(chunks).toString();
          const myReq: MinikinRequest = {
            body: body,
            url: req.url || "/",
            headers: req.headers,
            method: (req.method?.toUpperCase() || "GET") as HttpMethod,
            params: {},
          };
          resolve(myReq);
        });
    });
  }

  private async _handle(
    myReq: MinikinRequest,
    res: http.ServerResponse
  ): Promise<boolean> {
    // Loop through all of our handlers
    for (let i = 0; i < this._handlers.length; i++) {
      const handler = this._handlers[i];
      // See if the path and method match one of them
      const regexPath = new RegExp(
        "^" + handler[1].replace(/\/:[A-Za-z]+/g, "/([^/]+)") + "$"
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
        // Get response from handler
        const myResponse = await handler[2](myReq);
        // Send a response
        this._sendResponse(
          res,
          myResponse ||
            MinikinResponse.createFromJson(
              {
                message: "No content in response",
              },
              { statusCode: 500 }
            )
        );
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
      MinikinResponse.createFromJson(
        { message: "Not Found" },
        { statusCode: 404 }
      )
    );
  }

  private _sendResponse(
    httpResponse: http.ServerResponse,
    myResponse: MinikinResponse
  ) {
    httpResponse.writeHead(myResponse.statusCode, {
      "Content-Type": myResponse.mimeType,
    });
    httpResponse.end(myResponse.content);
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
    callback: MinikinRouteCallback
  ) {
    this._handlers.push([method, path, callback]);
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
