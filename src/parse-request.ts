import * as http from "http";
import Request from "./request";

const parseRequest = async (req: http.IncomingMessage): Promise<Request> => {
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
          })
        );
      });
  });
};

export default parseRequest;
