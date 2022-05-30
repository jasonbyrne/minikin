import MinikinResponse from "./response";

export const redirect = (url: string, code: number = 302) => {
  return new MinikinResponse("", {
    statusCode: code,
    headers: { Location: url },
  });
};
