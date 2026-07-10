export function mutationSucceeded<T>(rows: T[] | null | undefined, error: { message: string } | null) {
  return !error && Boolean(rows?.length);
}
