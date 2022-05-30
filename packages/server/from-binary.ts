import { ResponseParams } from "minikin-router";
import { file } from "./from-file";

export const binary = (filePath: string, opts?: ResponseParams) => {
  return file(filePath, opts, "binary");
};
