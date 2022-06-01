import { KeyValue } from "../interfaces";

export const mapToObject = (headers: Map<string, string>): KeyValue => {
  const obj: KeyValue = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
};
