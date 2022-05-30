export const objectToMap = (obj?: object): Map<string, string> => {
  const map = new Map<string, string>();
  Object.entries(obj || {}).forEach(([key, value]) => {
    map.set(key, value);
  });
  return map;
};
