export async function syncForEach(
  array: any[],
  callback: Function
): Promise<any> {
  for (let i = 0; i < array.length; i++) {
    await callback(array[i]);
  }
}
