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
    server.after((res) => __awaiter(void 0, void 0, void 0, function* () {
        res === null || res === void 0 ? void 0 : res.header("X-Flagpole", "1");
    }));
    server
        .route("GET /hello", () => (0, index_js_1.text)("test"))
        .after("GET /hello", (res) => __awaiter(void 0, void 0, void 0, function* () {
        return res === null || res === void 0 ? void 0 : res.content("foo").header("foo", "bar");
    }));
    server.route("GET /json", () => (0, index_js_1.json)({ message: "test" }));
    server
        .route("GET /replace", () => (0, index_js_1.text)("one thing"))
        .after("GET /replace", () => {
        return (0, index_js_1.text)("another");
    });
    const suite = (0, flagpole_1.default)("Minimal repro").base("http://localhost:8000");
    suite.finished.then(() => {
        server.close();
    });
    suite
        .scenario("Hello", "resource")
        .open("/hello")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.body).equals("foo");
        context.assert(context.response.header("foo")).equals("bar");
        context.assert(context.response.header("X-Flagpole")).equals("1");
    }));
    suite
        .scenario("JSON", "json")
        .open("/json")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.jsonBody.$.message).equals("test");
    }));
    suite
        .scenario("If it's not one thing, it's another", "resource")
        .open("/replace")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.body).equals("another");
    }));
}))();
