import flagpole from "flagpole";
import Server, { json, text } from "../../packages/server/dist/index.js";

(async () => {
  const server = await Server(8000);

  server.after(async (res) => {
    res?.header("X-Flagpole", "1");
  });

  server
    .route("GET /hello", () => text("test"))
    .after("GET /hello", async (res) => {
      return res?.content("foo").header("foo", "bar");
    });
  server.route("GET /json", () => json({ message: "test" }));

  server
    .route("GET /replace", () => text("one thing"))
    .after("GET /replace", () => {
      return text("another");
    });

  const suite = flagpole("Minimal repro").base("http://localhost:8000");

  suite.finished.then(() => {
    server.close();
  });

  suite
    .scenario("Hello", "resource")
    .open("/hello")
    .next(async (context) => {
      context.assert(context.response.body).equals("foo");
      context.assert(context.response.header("foo")).equals("bar");
      context.assert(context.response.header("X-Flagpole")).equals("1");
    });

  suite
    .scenario("JSON", "json")
    .open("/json")
    .next(async (context) => {
      context.assert(context.response.jsonBody.$.message).equals("test");
    });

  suite
    .scenario("If it's not one thing, it's another", "resource")
    .open("/replace")
    .next(async (context) => {
      context.assert(context.response.body).equals("another");
    });
})();
