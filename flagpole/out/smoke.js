"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const flagpole_1 = require("flagpole");
const index_js_1 = require("../../packages/server/dist/index.js");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield (0, index_js_1.default)(8000);
    server.routes({
        "GET /string": () => "Hello",
        "GET /file": () => index_js_1.Response.fromFile("./flagpole/fixtures/test.html"),
        "GET /hello": () => index_js_1.Response.fromJson({
            message: "Hello from Minikin!",
        }, {
            headers: { "X-Test": "Hello" },
        }),
        "GET /hello/:name": (req) => index_js_1.Response.fromJson({
            message: `Hello to ${req.params.name} from Minikin!`,
        }),
        "GET /trailers": () => index_js_1.Response.fromString("Hi", {
            trailers: { foo: "bar" },
        }),
        "GET /cookie": (req) => index_js_1.Response.fromString(String(req.cookies.test)),
        "GET /template": () => index_js_1.Response.fromString("Hello, {{ name }}").render({ name: "Jason" }),
        "GET /template2": () => index_js_1.Response.fromString("1+1=${data.value + 1}").render({ value: 1 }),
        "GET /protected": [
            () => { },
            (req) => {
                if (!req.headers["Authorization"]) {
                    return index_js_1.Response.fromString("foo", { statusCode: 401 });
                }
            },
            () => index_js_1.Response.fromString("bar"),
        ],
        "POST /json": (req) => index_js_1.Response.fromString(req.json.message),
        "GET /query": (req) => index_js_1.Response.fromJson({ message: req.query.get("message") }),
        "PATCH|PUT *": () => index_js_1.Response.fromString("PATCH or PUT"),
        "GET *": () => index_js_1.Response.fromJson({
            message: "File not found",
        }, { statusCode: 404 }),
        "* *": () => index_js_1.Response.fromString("No match"),
    });
    const suite = (0, flagpole_1.default)("Basic Smoke Test of Site").base("http://localhost:8000");
    suite.finished.then(() => {
        server.close();
    });
    suite
        .scenario("Hello", "json")
        .open("/hello")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.comment(context.response.body);
        const message = yield context.exists("message");
        context.assert(message.$).equals("Hello from Minikin!");
        context.assert(context.response.header("X-Test")).equals("Hello");
    }));
    suite
        .scenario("Hello to Jason", "json")
        .open("/hello/jason")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        const message = yield context.exists("message");
        context.assert(message.$).equals("Hello to jason from Minikin!");
    }));
    suite
        .scenario("Should get a 404", "json")
        .open("/foo")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(404);
        context.assert(yield context.find("message")).equals("File not found");
    }));
    suite
        .scenario("Should get a 403", "resource")
        .open("/protected")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(401);
        context.assert(context.response.body).equals("foo");
    }));
    suite
        .scenario("Cookie test", "resource")
        .open("/cookie")
        .setHeader("cookie", "test=foobar")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.body).equals("foobar");
    }));
    suite
        .scenario("Test Wildcard Method", "resource")
        .open("POST /random")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.body).equals("No match");
    }));
    suite
        .scenario("Test Pipe-Delimited Methods", "resource")
        .open("PUT /random")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.body).equals("PATCH or PUT");
    }));
    suite
        .scenario("Test Render Template", "resource")
        .open("GET /template")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.body).equals("Hello, Jason");
    }));
    suite
        .scenario("Test Render Template with Eval", "resource")
        .open("GET /template2")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.body).equals("1+1=2");
    }));
    suite
        .scenario("Test Trailers", "resource")
        .open("GET /trailers")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
    }));
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
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.comment(context.response.body);
        const h1 = yield context.exists("h1");
        context.assert(yield h1.getInnerText()).like("hello world!");
    }));
    suite
        .scenario("Return a string", "resource")
        .open("/string")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.statusCode).equals(200);
        context.assert(context.response.body).equals("Hello");
    }));
}))();
