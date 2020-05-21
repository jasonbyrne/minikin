# Minikin

Yeah. Another web server framework. Why?

The other ones are really big. They have dependencies and do too much. I just wanted a simple way to start up an HTTP server and handle some routes. No fluff.

So here you go...

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
