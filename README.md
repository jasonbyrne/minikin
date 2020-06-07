# Minikin

![Version](https://badgen.net/npm/v/minikin)
![Minified](https://badgen.net/bundlephobia/min/minikin)
![Minzipped](https://badgen.net/bundlephobia/minzip/minikin)

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
  Response.fromString("Hey!").addHeader("X-Foo", "Bar")
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
  Response.fromString("See ya later").addTrailer("X-Foo", "Bar")
);
```

Similarly you can set cookies on the response

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hey!").addCookie("X-Foo", "Bar", 60)
);
```

The above sets the TTL (Max-Age) on the cookie to 60 seconds. Alternately, the third argument can accept an object allowing you to set any of the standard cookie options.

```javascript
server.route("GET /hello", () =>
  Response.fromString("Hey!").addCookie("X-Foo", "Bar", {
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

Minkin also supports middleware, most often used as guards. You can chain callbacks.

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

You can also chain routes if you prefer that syntax:

```javascript
server
  .route("GET /hello", () => Response.fromString("hello"))
  .route("GET /hello/:name", (req) => Response.fromJson({
    message: `Hello to ${req.params.name} from Minikin!`,
  })
  .route("GET /admin", () => Response.fromString("Forbidden", {
    statusCode: 403
  });
```
