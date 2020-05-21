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
const index_js_1 = require("../../dist/index.js");
(() => __awaiter(void 0, void 0, void 0, function* () {
    const server = yield index_js_1.MinikinServer.create(8000);
    server.route("GET", "/hello", () => {
        return index_js_1.MinikinResponse.createFromJson({
            message: "Hello from Minikin!",
        });
    });
    server.route("GET", "/hello/:name", (req) => {
        return index_js_1.MinikinResponse.createFromJson({
            message: `Hello to ${req.params.name} from Minikin!`,
        });
    });
    const suite = flagpole_1.default("Basic Smoke Test of Site").base("http://localhost:8000");
    suite.finished.then(() => {
        server.close();
    });
    suite
        .scenario("Hello", "json")
        .open("/hello")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        const message = yield context.exists("message");
        context.assert(message.$).equals("Hello from Minikin!");
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
    }));
}))();
