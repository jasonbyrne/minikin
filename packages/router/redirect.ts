import { defaultStatusMessage } from "./interfaces";
import MinikinResponse from "./response";

export const redirect = (url: string, code: number = 302) => {
  return new MinikinResponse("", {
    status: code,
    statusText: defaultStatusMessage[code] || "Redirect",
    headers: { Location: url },
  });
};
