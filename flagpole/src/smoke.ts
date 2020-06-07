import flagpole from "flagpole";
import { Server, Response } from "../../dist/index.js";

(async () => {
  const server = await Server.listen(8000);

  server
    .route("GET /hello", () =>
      Response.fromJson(
        {
          message: "Hello from Minikin!",
        },
        {
          headers: [["X-Test", "Hello"]],
        }
      )
    )
    .route("GET /hello/:name", (req) =>
      Response.fromJson({
        message: `Hello to ${req.params.name} from Minikin!`,
      })
    )
    .route("GET /trailers", (req) =>
      Response.fromString("Hi", {
        trailers: [["foo", "bar"]],
      })
    )
    .route("GET /cookie", (req) => Response.fromString(req.cookies.test))
    .route("GET /template", (req) =>
      Response.fromString("Hello, {{ name }}").render({ name: "Jason" })
    )
    .route(
      "GET /protected",
      () => {},
      (req) => {
        if (!req.headers["Authorization"]) {
          return Response.fromString("foo", { statusCode: 401 });
        }
      },
      () => Response.fromString("bar")
    )
    .route("GET *", () =>
      Response.fromJson(
        {
          message: "File not found",
        },
        { statusCode: 404 }
      )
    )
    .route("PATCH|PUT *", () => Response.fromString("PATCH or PUT"))
    .route("* *", () => Response.fromString("No match"));

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
      context.assert(context.response.header("X-Test")).equals("Hello");
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
      context.assert(await context.find("message")).equals("File not found");
    });

  suite
    .scenario("Should get a 403", "resource")
    .open("/protected")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(401);
      context.assert(context.response.body).equals("foo");
    });

  suite
    .scenario("Cookie test", "resource")
    .open("/cookie")
    .setHeader("cookie", "test=foobar")
    .next(async (context) => {
      context.assert(context.response.body).equals("foobar");
    });

  suite
    .scenario("Test Wildcard Method", "resource")
    .open("POST /random")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context.assert(context.response.body).equals("No match");
    });

  suite
    .scenario("Test Pipe-Delimited Methods", "resource")
    .open("PUT /random")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context.assert(context.response.body).equals("PATCH or PUT");
    });

  suite
    .scenario("Test Render Template", "resource")
    .open("GET /template")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context.assert(context.response.body).equals("Hello, Jason");
    });

  suite
    .scenario("Test Trailers", "resource")
    .open("GET /trailers")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
    });
})();
