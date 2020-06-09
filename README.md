![alt Minikin | Small but mighty typescript server + router](https://github.com/jasonbyrne/minikin/blob/master/minikin.png?raw=true)

![Version](https://badgen.net/npm/v/minikin)
![Minified](https://badgen.net/bundlephobia/min/minikin)

SMALL BUT MIGHTY!

Yet another web server? Why?! Well, the other ones are really big. They have dependencies and do too much. I just wanted a simple way to start up an HTTP server, handle some routes, and handle the core use cases that you need most of the time. 80-20 rule. No other fluff.

So here you go.

Install it with:

```
npm i minikin
```

Then start using it:

```javascript
import { Server, Response } from "minikin";

(async () => {
  const server = await Server.listen(8000);

  server.route("GET /hello", () =>
    Response.fromJson({
      message: "Hello from Minikin!",
    })
  );
})();
```

Route callbacks also support async/await seamlessly.

```javascript
server.route("GET /yo", async (req) => {
  const data = await goGetSomeData();
  Response.fromString(data);
});
```

Minikin can also handle URL path params out of the box:

```javascript
server.route("GET /hello/:name", (req) =>
  Response.fromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  })
);
```

It will parse the JSON body automatically:

```javascript
server.route("POST /person", (req) => {
  const name = req.body.name; // { name: "Jason" }
  return Response.fromJson({
    message: `You want to create a new person named ${name}`,
  });
});
```

If you want to do HTTPS, pass in your certificate information as the segment argument

```javascript
const server = await Server.listen(8000, {
  pfx: fs.readFileSync("test/fixtures/test_cert.pfx"),
  passphrase: "sample",
});
```

For a catch-all route, put it LAST. And do this:

```javascript
server.route("GET *", () =>
  Response.fromJson(
    {
      message: "File not found",
    },
    { statusCode: 404 }
  )
);
```

You can also wildcard parts of the route like:

```javascript
server.route("GET /*/foo", () =>
  Response.fromJson({
    message: "This will respond to /hello/foo or /goodbye/foo",
  })
);
```

And you can use regex within your routes

```javascript
server.route("GET /hello/?", () =>
  Response.fromJson({
    message: "This will respond to /hello or /hello/",
  })
);
```

If you need to handle multiple HTTP Methods with the same handler

```javascript
server.route("PUT|PATCH /hello", () => Response.fromString("Hi"));
```

You can also do a wildcard method

```javascript
server.route("* /goodbye", () => Response.fromString("Cya"));
```

If you do not set a method at all, it will be wildcard by default, which is equivalent to the last example.

```javascript
server.route("/goodbye", () => Response.fromString("Cya"));
```

So as a universal catch-all you could just do:

```javascript
server.route("*", () => Response.fromString("Catch all"));
```

Which would be the same as the example below. Remember: ALWAYS put the catch-all case LAST!

```javascript
server.route("* *", () => Response.fromString("Catch all"));
```

The final option for a universal catch-all is to totally skip the first argument.

So as a universal catch-all you could just do:

```javascript
server.route(() => Response.fromString("Catch all"));
```

To read cookies:

```javascript
server.route("GET /hello", (req) =>
  Response.fromString(req.cookies.myCookie ? "cookie set" : "cookie not set")
);
```

To read headers:

```javascript
server.route("GET /hello", (req) =>
  Response.fromString(req.headers.someHeader ? "header set" : "header not set")
);
```

To serve a response from a local file:

```javascript
server.route("GET /hello", () => Response.fromFile("/path/to/file"));
```

If it's a local binary file, like an image:

```javascript
server.route("GET /hello", () => Response.fromBinary("/path/to/image"));
```

Or to respond with a string:

```javascript
server.route("GET /hello", () => Response.fromString("Hello World!"));
```

To set status code:

```javascript
server.route("GET /hello", () =>
  Response.fromString("Forbidden", {
    statusCode: 403,
  })
);
```

And to set any headers:

```javascript
server.route("GET /hello", () =>
  Response.fromString("Forbidden", {
    statusCode: 403,
    headers: [
      ["X-Custom-Header", "foobar"],
      ["Cache-Control", "no-store"],
    ],
  })
);
```

Alternately you can set headers like this

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hey!").header("X-Foo", "Bar")
);
```

If you want to add trailers, they work the same way as headers except are called `trailer`

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hi", {
    trailers: [["X-Some-Trailer", "foobar"]],
  })
);

// Or

server.route("GET /bye", () =>
  Response.fromString("See ya later").trailer("X-Foo", "Bar")
);
```

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

Simple templating with variable replacement is built in, as well. This will replace any strings with `{{ name }}` with the corresponding value in the second argument.

```javascript
server.route("GET /hello", () =>
  Response.fromTemplate("public/hello.html", { name: "Jason" })
);
```

Alternately, you can call the render method on any response to pass in the key-value replacement.

```javascript
server.route("GET /hello/:name", () =>
  Response.fromString("Hello, {{ name }}").render({ name: req.params.name })
);
```

Minkin also supports middleware, most often used as guards. This allows you to chain callbacks inline on a specific route.

```javascript
const requireAuthentication = (req: Request) => {
  if (!req.headers["Authorization"]) {
    return Response.fromString("Must Authenticate", { statusCode: 401 });
  }
};

server.route("GET /protected", requireAuthentication, () =>
  Response.fromString("OK")
);
```

You can add global level middleware as well, which can act as plugins and pre-processors. The `use` method allows this, similar to other frameworks. There is an alias for this called `beforeAll`, which describes better what it does (runs before the normal routes). However, `use` is the standard with other frameworks and so more familiar to developers.

```javascript
server.use(parseJwtToken);
server.use(processFormEncodedInput);
server.use((req) => {
  if (req.headers["User-Agent"].test(/roku|firetv|appletv/i)) {
    req.isConnectedTv = true;
  }
});
```

These `use` handlers are exactly the same as any other route. They just are processed first. So this means you can return a response from, which will stop any further processing.

```javascript
server.use(() => Response.fromString("STOP!"));
```

You cal also pass a first argument to restrict it to certain methods and paths. This can allow it to act as a guard for many endpoints at once:

```javascript
server.use("PUT|POST|PATCH|DELETE /api/*", requireAuthentication);
server.use("/images/*", preventLeeching);
```

You can also list out multiple use callbacks, like you can on a normal route. This is useful to enforce multiple rules or to run the request through multiple pre-processors.

```javascript
server.use("/admin/*", requireAuthentication, mustBeAdmin);
```

You can also use the `routes` method to set multiple routes in an object form:

```javascript
server.routes({
  "GET /hello": () => Response.fromString("hello")),
  "GET /hello/:name": (req) => Response.fromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  },
  "GET /admin": () => Response.fromString("Forbidden", {
    statusCode: 403
  }
});
```

To do a redirect:

```javascript
server.route("GET /foo", () => Response.redirect("/bar"));
```

The default status code for a redirect is 302, but you can change that with the second argument:

```javascript
server.route("GET /foo", () => Response.redirect("/bar", 301));
```

If you only want to use the routing of Minikin (and not the HTTP server part), you can instantiate a new router directly:

```javascript
import { Router } from "minikin";

const router = new Router();
```

Then you can use the same routing methods above such as

```javascript
router.route("GET /hello", () => Response.fromString("hi"));
```

And you can triggler the request handling with the `handle` method:

```javascript
const response = await router.handle(req);
```

On a given route (on both `Router` or `Server`), you can call the `after` method to run logic on the corresponding response. This allows you to modify the response before it gets sent back to the user.

```javascript
router
  .route("GET /hello", () => Response.fromString("hi"))
  .after((res) => {
    res.content = "bye";
  });
```

Similarly if you want to run a modifier on the response of every end point, you can do so with the `afterAll` method of both the `Server` and `Router` objects.

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
