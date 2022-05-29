import flagpole from "flagpole";
import { Server, Response } from "../../packages/server/dist/index.js";

(async () => {
  const server = await Server.listen(8000);

  server.routes({
    "GET /string": () => "Hello",
    "GET /file": () => Response.fromFile("./flagpole/fixtures/test.html"),
    "GET /hello": () =>
      Response.fromJson(
        {
          message: "Hello from Minikin!",
        },
        {
          headers: { "X-Test": "Hello" },
        }
      ),
    "GET /hello/:name": (req) =>
      Response.fromJson({
        message: `Hello to ${req.params.name} from Minikin!`,
      }),
    "GET /trailers": () =>
      Response.fromString("Hi", {
        trailers: { foo: "bar" },
      }),
    "GET /cookie": (req) => Response.fromString(String(req.cookies.test)),
    "GET /template": () =>
      Response.fromString("Hello, {{ name }}").render({ name: "Jason" }),
    "GET /template2": () =>
      Response.fromString("1+1=${data.value + 1}").render({ value: 1 }),
    "GET /protected": [
      () => {},
      (req) => {
        if (!req.headers["Authorization"]) {
          return Response.fromString("foo", { statusCode: 401 });
        }
      },
      () => Response.fromString("bar"),
    ],
    "POST /json": (req) => Response.fromString(req.json.message),
    "GET /query": (req) =>
      Response.fromJson({ message: req.query.get("message") }),
    "PATCH|PUT *": () => Response.fromString("PATCH or PUT"),
    "GET *": () =>
      Response.fromJson(
        {
          message: "File not found",
        },
        { statusCode: 404 }
      ),
    "* *": () => Response.fromString("No match"),
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
      context.comment(context.response.body);
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
    .scenario("Test Render Template with Eval", "resource")
    .open("GET /template2")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context.assert(context.response.body).equals("1+1=2");
    });

  suite
    .scenario("Test Trailers", "resource")
    .open("GET /trailers")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
    });

  suite
    .scenario("Test POSTing JSON body", "resource")
    .setJsonBody({
      message: "foo",
    })
    .open("POST /json")
    .next((context) => {
      context.assert(context.response.body).equals("foo");
    });

  suite
    .scenario("Test Query String Parsing", "resource")
    .open("GET /query?message=bar")
    .next((context) => {
      context.assert(context.response.jsonBody.$.message).equals("bar");
    });

  suite
    .scenario("Return a file", "html")
    .open("/file")
    .next(async (context) => {
      context.comment(context.response.body);
      const h1 = await context.exists("h1");
      context.assert(await h1.getInnerText()).like("hello world!");
    });

  suite
    .scenario("Return a string", "resource")
    .open("/string")
    .next(async (context) => {
      context.assert(context.response.statusCode).equals(200);
      context.assert(context.response.body).equals("Hello");
    });
})();
