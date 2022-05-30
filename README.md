![alt Minikin | Small but mighty typescript router](https://github.com/jasonbyrne/minikin/blob/master/minikin.png?raw=true)

![Version](https://badgen.net/npm/v/minikin)
![Size](https://badgen.net/packagephobia/publish/minikin)

SMALL BUT MIGHTY!

Yet another router? Why?! Well, the other ones are really big. They have dependencies and do too much. I just wanted a simple way to start up an HTTP server, handle some routes, and handle the core use cases that you need most of the time. 80-20 rule. No other fluff. And no dependencies!

# Getting Started

In the 1.* versions of Minikin, it shipped with both the router and server together. With version 2.0 the base package of `minikin` only includes the router. Choose the appropriate option below for your needs.

## "Hello World" with Minikin Server

First install the project dependency:

```
npm i minikin
```

Now in our code, we will import Minikin and then instantiate an instance of Minikin Server. Finally we define a route that will wildcard respond to any request with "Hello from Minikin!". Notice that `Minikin.server()` is awaited, so we wrap the entire thing in a self-calling `async` function.

```javascript
import Server from "minikin";

(async () => {
  const minikin = await Server();

  minikin.route("*", () => "Hello from Minikin!";
})();
```

In the above example, Minikin automatically picked an open port to listen on. The console log will tell you which port it picked or you can grab it with:

```javascript
const port = minikin.port;
```

However, typically you want to specify the port to listen on. Just use the first argument to do so:

```javascript
const minikin = await Server(8080);
```

Or of course you can use an environment variable:

```javascript
const minikin = await Server(process.env.PORT);
```

## Using the router only

You can use the main `minikin` library and instantiate the router module like this. Unlike the server, we do not need to await the router so it doesn't need to be wrapped in an `await` function.

```javascript
import { Router } from "minikin";

const minikin = Router.create();
```

However, if you are not going to use the web server part of Minikin, you can save a few bytes by instaling just the router component:

```
npm i minikin-router
```

Then you'd import `minikin-router` instead of `minikin` proper:

```javascript
import Router from "minikin-router";

const minikin = Router();
```

If aren't using the Minikin server, it means you're listening for incoming requests yourself. So define the routes the same way the below examples show you. Then when you get the event for the incoming request, pass it to the Minikin router with the `handle` method. It will parse it and return the response, which must be awaited.

```javascript
const response = await minikin.handle(req);
```

# Routing examples

The examples below for defining routes work the same for either the server or the router.

## Basic route

This will define a route that that response to `GET` requests to the `/yo` path. The second argument is a callback function that receives the incoming request. Here we simply return a string "Yo back at ya" as the response.

```javascript
minikin.route("GET /yo", (req) => "Yo back at ya");
```

This is the equivalent of the more longhand

```javascript
minikin.route("GET /yo", (req) => Response.fromString("Yo back at ya"));
```

For the longhand versions (which will be necessary with many other examples below), you'll need to also import the `Response` class with:

```javascript
import { Response } from "minikin-router";
```

## Async callbacks

All request callbacks also support `async` so that you can `await` other calls.

```javascript
minikin.route("GET /some-text", async (req) => {
  const text = await goGetSomeText();
  return Response.fromString(text);
});
```

To instead respond with JSON:

```javascript
minikin.route("GET /some-json", async (req) => {
  const data = await goGetSomeData();
  return Response.fromJson(data);
});
```

## Set Status Code

Use the second argument of `fromJson`, `fromString`, and similar `from*` methods to set additional parameters including the status code.

```javascript
minikin.route("GET /error400", (req) =>
  Response.fromJson({
    error: `Don't call this endpoint!`,
  }, {
    statusCode: 400
  })
);
```

## Set Headers

You can also use that second argument to set headers:

```javascript
minikin.route("GET /with-headers", (req) =>
  Response.fromString("This is the response body", {
    headers: {
      "X-Custom-Header": "Some Value"
    }
  })
);
```

Alternately you can set headers like this

```javascript
minikin.route("GET /hello", () =>
  Response.fromString("Hey!").header("X-Foo", "Bar")
);
```

If you want to add trailers, they work the same way as headers except are called `trailer`

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hi", {
    trailers: { "X-Some-Trailer": "foobar" },
  })
);

Or...

server.route("GET /bye", () =>
  Response.fromString("See ya later").trailer("X-Foo", "Bar")
);
```

## Set Cookies

Similarly you can set cookies on the response

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hey!").cookie("X-Foo", "Bar", 60)
);
```

The above sets the TTL (Max-Age) on the cookie to 60 seconds. Alternately, the third argument can accept an object allowing you to set any of the standard cookie options.

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hey!").cookie("X-Foo", "Bar", {
    "Max-Age": 60,
    SameSite: true,
  })
);
```

## Path Paramaters

Minikin can also handle URL path params out of the box:

```javascript
minikin.route("GET /hello/:name", (req) =>
  Response.fromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  })
);
```

## Read incoming JSON data

It will parse the JSON body automatically:

```javascript
minikin.route("POST /person", (req) => {
  const name = req.body.name; // { name: "Jason" }
  return Response.fromJson({
    message: `You want to create a new person named ${name}`,
  });
});
```

## Using HTTPS/SSL

If you want to do HTTPS, pass in your certificate information as the segment argument

```javascript
const minikin = await Minikin.server(8000, {
  pfx: fs.readFileSync("test/fixtures/test_cert.pfx"),
  passphrase: "sample",
});
```

## Catch-All Routes

For a catch-all for all `GET` requests, put this LAST:

```javascript
minikin.route("GET *", () =>
  Response.fromJson(
    {
      message: "File not found",
    },
    { statusCode: 404 }
  )
);
```

If you want to catch all HTTP methods, use just the wildcard. Remember: ALWAYS put the catch-all case LAST!

```javascript
minikin.route("*", () => Response.fromString("Catch all"));
```

This is equivalent to

```javascript
minikin.route("* *", () => Response.fromString("Catch all"));
```

If you want to be even more concise, you can totally skip the first argument. This will be the same as the previous two examples.

```javascript
minikin.route(() => Response.fromString("Catch all"));
```

## Route Patterns and Wildcards

You can also wildcard parts of the route like:

```javascript
minikin.route("GET /*/foo", () =>
  Response.fromJson({
    message: "This will respond to /hello/foo or /goodbye/foo",
  })
);
```

And you can use regex within your routes. This will accept either `/hello` or `/hello/`. The question mark makes the trailing slash optional.

```javascript
minikin.route("GET /hello/?", () =>
  Response.fromJson({
    message: "This will respond to /hello or /hello/",
  })
);
```

## Route that response to multiple HTTP Methods

If you need to handle multiple HTTP Methods with the same handler

```javascript
minikin.route("PUT|PATCH /hello", () => Response.fromString("Hi"));
```

You can also do a wildcard method

```javascript
minikin.route("* /goodbye", () => Response.fromString("Cya"));
```

If you do not set a method at all, it will be wildcard by default, which is equivalent to the last example.

```javascript
minikin.route("/goodbye", () => Response.fromString("Cya"));
```

## Read Cookies

Minikin will automatically read incoming cookies and make then available:

```javascript
minikin.route("GET /hello", (req) =>
  Response.fromString(req.cookies.myCookie ? "cookie set" : "cookie not set")
);
```

## Read Headers

Minikin also reads the incoming headers for you:

```javascript
minikin.route("GET /hello", (req) =>
  Response.fromString(req.headers.someHeader ? "header set" : "header not set")
);
```

## Servce response from a local file

If it's a file that contains text:

```javascript
minikin.route("GET /hello", () => Response.fromFile("/path/to/file"));
```

If it's a local binary file, like an image:

```javascript
minikin.route("GET /hello", () => Response.fromBinary("/path/to/image"));
```

## Templating

You can pull a resposne from a static file, like you would in the previous two examples, but then do simple template replacement. This example will replace any strings with `{{ name }}` in the `hello.html` file with the corresponding value in the second argument.

```javascript
minikin.route("GET /hello", () =>
  Response.fromTemplate("public/hello.html", { name: "Jason" })
);
```

Alternately, you can call the render method on any response to pass in the key-value replacement.

```javascript
minikin.route("GET /hello/:name", () =>
  Response.fromString("Hello, {{ name }}").render({ name: req.params.name })
);
```

# Middleware

Minkin also supports middleware, most often used as guards. This allows you to chain callbacks inline on a specific route. This first example adds authentication to a single route.

```javascript
const requireAuthentication = (req: Request) => {
  if (!req.headers["Authorization"]) {
    return Response.fromString("Must Authenticate", { statusCode: 401 });
  }
};

minikin.route("GET /protected", requireAuthentication, () =>
  Response.fromString("OK")
);
```

You can add global level middleware as well, which can act as plugins and pre-processors. The `use` method allows this, similar to other frameworks. There is an alias for this called `beforeAll`, which describes better what it does (runs before the normal routes). However, `use` is the standard with other frameworks and so more familiar to developers.

```javascript
minikin.use(parseJwtToken);
minikin.use(processFormEncodedInput);
minikin.use((req) => {
  if (req.headers["User-Agent"].test(/roku|firetv|appletv/i)) {
    req.isConnectedTv = true;
  }
});
```

These `use` handlers are exactly the same as any other route. They just are processed first. So this means you can return a response from, which will stop any further processing.

```javascript
minikin.use(() => Response.fromString("STOP!"));
```

You cal also pass a first argument to restrict it to certain methods and paths. This can allow it to act as a guard for many endpoints at once:

```javascript
minikin.use("PUT|POST|PATCH|DELETE /api/*", requireAuthentication);
minikin.use("/images/*", preventLeeching);
```

You can also list out multiple use callbacks, like you can on a normal route. This is useful to enforce multiple rules or to run the request through multiple pre-processors.

```javascript
minikin.use("/admin/*", requireAuthentication, mustBeAdmin);
```

## Set multiple routes at once

You can also use the `routes` method (instead of singular `route` method) to set multiple routes in an object form:

```javascript
minikin.routes({
  "GET /hello": () => "hello",
  "GET /hello/:name": (req) => Response.fromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  },
  "GET /admin": () => Response.fromString("Forbidden", {
    statusCode: 403
  }
});
```

# Redirects

To do a basic redirect:

```javascript
minikin.route("GET /foo", () => Response.redirect("/bar"));
```

The default status code for a redirect is 302, but you can change that with the second argument:

```javascript
minikin.route("GET /foo", () => Response.redirect("/bar", 301));
```

# After

On any route, you can call the `after` method to run logic on the corresponding response. This allows you to modify the response before it gets sent back to the user. This first example would override the response of "hi" with "bye" instead:

```javascript
router
  .route("GET /hello", () => Response.fromString("hi"))
  .after((res) => {
    res.content = "bye";
  });
```

If you want to run a modifier on the response of all endpoints (not a specific route), you can do so with the `afterAll` method.

```javascript
router.afterAll((res) => {
  res.header("X-Some-Header", "value");
});
```

Just like you can with `use`/`beforeAll` and `route`, you can add in a path as the first argument to `afterAll` to only run it on matching paths.

```javascript
router.afterAll("GET /api/*", (res) => {
  // Allow CORS on API endpoints
  res.header("Access-Control-Allow-Origin", "*");
});
```

And potentially, you could completely replace a response by returning it.

```javascript
router.afterAll("GET /replaceMe", (res) => {
  return Response.fromString("some new response");
});
```
