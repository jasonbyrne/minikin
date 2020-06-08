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
    const server = yield index_js_1.Server.listen(8000);
    server.route("GET /hello", () => index_js_1.Response.fromString("test"));
    server.route("GET /json", () => index_js_1.Response.fromJson({ message: "test" }));
    const suite = flagpole_1.default("Minimal repro").base("http://localhost:8000");
    suite.finished.then(() => {
        server.close();
    });
    suite
        .scenario("Hello", "resource")
        .open("/hello")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.body).equals("test");
    }));
    suite
        .scenario("JSON", "json")
        .open("/json")
        .next((context) => __awaiter(void 0, void 0, void 0, function* () {
        context.assert(context.response.jsonBody.$.message).equals("test");
    }));
}))();
