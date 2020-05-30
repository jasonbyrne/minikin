# Minikin

Yeah. Another web server framework. Why?

The other ones are really big. They have dependencies and do too much. I just wanted a simple way to start up an HTTP server and handle some routes. No fluff.

So here you go.

Install it with:

```
npm i minikin
```

Then start using it:

```javascript
import { MinikinServer, MinikinResponse } from "minikin";

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
})();
```

It will parse the JSON body automatically:

```javascript
server.route("POST", "/person", (req) => {
  const name = req.body.name; // { name: "Jason" }
  return MinikinResponse.createFromJson({
    message: `You want to create a new person named ${name}`,
  });
});
```

If you want to do HTTPS, pass in your certificate information as the segment argument

```javascript
const server = await MinikinServer.create(8000, {
  pfx: fs.readFileSync("test/fixtures/test_cert.pfx"),
  passphrase: "sample",
});
```

For a catch-all route, put it LAST. And do this:

```javascript
server.route("GET", "*", () => {
  return MinikinResponse.createFromJson(
    {
      message: "File not found",
    },
    { statusCode: 404 }
  );
});
```

You can also wildcard parts of the route like:

```javascript
server.route("GET", "/*/foo", () => {
  return MinikinResponse.createFromJson({
    message: "This will respond to /hello/foo or /goodbye/foo",
  });
});
```

And you can use regex within your routes

```javascript
server.route("GET", "/hello/?", () => {
  return MinikinResponse.createFromJson({
    message: "This will respond to /hello or /hello/",
  });
});
```

To serve a response from a local file:

```javascript
server.route("GET", "/hello", () => {
  return MinikinResponse.createFromFile("/path/to/file");
});
```

Or to respond with a string:

```javascript
server.route("GET", "/hello", () => {
  return MinikinResponse.createFromString("Hello World!");
});
```

To set status code:

```javascript
server.route("GET", "/hello", () => {
  return MinikinResponse.createFromString("Forbidden", {
    statusCode: 403,
  });
});
```

And to set any headers:

To set status code:

```javascript
server.route("GET", "/hello", () => {
  return MinikinResponse.createFromString("Forbidden", {
    statusCode: 403,
    headers: [
      ["X-Custom-Header", "foobar"],
      ["Cache-Control", "no-store"],
    ],
  });
});
```
