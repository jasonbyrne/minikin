import flagpole from "flagpole";
import { MinikinServer, MinikinResponse } from "../../dist/index.js";

(async () => {
  const server = await MinikinServer.create(8000);

  server.route("GET", "/hello", () => {
    return MinikinResponse.createFromJson({
      message: "Hello from Minikin!",
    });
  });

  server.route("GET", "/hello/:name", (req) => {
    return MinikinResponse.createFromJson({
      message: `Hello to ${req.params.name} from Minikin!`,
    });
  });

  const suite = flagpole("Basic Smoke Test of Site").base(
    "http://localhost:8000"
  );

  suite.finished.then(() => {
    server.close();
  });

  suite
    .scenario("Hello", "json")
    .open("/hello")
    .next(async (context) => {
      const message = await context.exists("message");
      context.assert(message.$).equals("Hello from Minikin!");
    });

  suite
    .scenario("Hello to Jason", "json")
    .open("/hello/jason")
    .next(async (context) => {
      const message = await context.exists("message");
      context.assert(message.$).equals("Hello to jason from Minikin!");
    });

  suite
    .scenario("Should get a 404", "json")
    .open("/foo")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(404);
    });
})();
