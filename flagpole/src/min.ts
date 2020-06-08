import flagpole from "flagpole";
import { Server, Response } from "../../dist/index.js";

(async () => {
  const server = await Server.listen(8000);

  server.route("GET /hello", () => Response.fromString("test"));
  server.route("GET /json", () => Response.fromJson({ message: "test" }));

  const suite = flagpole("Minimal repro").base("http://localhost:8000");

  suite.finished.then(() => {
    server.close();
  });

  suite
    .scenario("Hello", "resource")
    .open("/hello")
    .next(async (context) => {
      context.assert(context.response.body).equals("test");
    });

  suite
    .scenario("JSON", "json")
    .open("/json")
    .next(async (context) => {
      context.assert(context.response.jsonBody.$.message).equals("test");
    });
})();
