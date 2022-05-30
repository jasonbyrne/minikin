import { file } from "./from-file";
import { ResponseParams, TemplateKeyValues } from "minikin-router/interfaces";

export const template = (
  filePath: string,
  kv: TemplateKeyValues,
  opts?: ResponseParams
) => {
  return file(filePath, opts).render(kv);
};
