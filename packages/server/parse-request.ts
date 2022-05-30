import * as http from "http";
import { KeyValue, MinikinRequest } from "minikin-router";

const parseRequest = async (
  req: http.IncomingMessage
): Promise<MinikinRequest> => {
  return new Promise((resolve) => {
    const chunks: any[] = [];
    req
      .on("data", (chunk: any) => {
        chunks.push(chunk);
      })
      .on("end", () => {
        const headers: KeyValue = {};
        Object.entries(req.headers).forEach(([key, value]) => {
          headers[key] = String(value);
        });
        const trailers: KeyValue = {};
        Object.entries(req.trailers).forEach(([key, value]) => {
          trailers[key] = String(value);
        });
        resolve(
          new MinikinRequest({
            body: Buffer.concat(chunks).toString(),
            url: req.url || "/",
            headers,
            trailers,
            method: req.method?.toUpperCase() || "GET",
          })
        );
      });
  });
};

export default parseRequest;
