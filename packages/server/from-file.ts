import { Encoding } from "crypto";
import path from "path";
import fs from "fs";
import { MinikinResponse, json, ResponseParams } from "minikin-router";
import { commonFileTypes } from "./common-file-types";

export const file = (
  filePath: string,
  opts?: ResponseParams,
  encoding: Encoding = "utf8"
) => {
  filePath = path.normalize(filePath);
  const possiblePaths: string[] = [
    path.resolve(filePath),
    path.join(__dirname, filePath),
    path.join(process.cwd(), filePath),
    path.join(path.dirname(process.argv[1]), filePath),
  ];
  if (require.main) {
    possiblePaths.push(
      path.join(path.dirname(require.main?.filename), filePath)
    );
  }
  try {
    possiblePaths.push(fs.realpathSync(filePath));
  } catch (ex) {}
  const fullPath = possiblePaths.find((path) => fs.existsSync(path));
  if (!fullPath) {
    console.error(possiblePaths);
    return json(
      {
        message: `${filePath} was not found`,
      },
      {
        status: 404,
      }
    );
  }
  const extension = path.extname(fullPath).substring(1);
  const content = fs.readFileSync(fullPath, encoding);
  return new MinikinResponse(content, {
    ...{
      headers: { "Content-Type": commonFileTypes[extension] || "text/html" },
    },
    ...opts,
  });
};
