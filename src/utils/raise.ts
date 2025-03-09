export function raiseNil<T>(data: T, message?: string): Exclude<T, null | undefined | never | void> {
  if (data === null || data === undefined) {
    throw new Error(message || 'Expected value to be non-nil');
  }

  return data as Exclude<T, null | undefined | never | void>;
}
