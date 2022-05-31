import { RouterInit } from "minikin-router";
import * as https from "https";

export type ServerInit = https.ServerOptions & RouterInit;
