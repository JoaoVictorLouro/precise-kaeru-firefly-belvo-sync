export async function retryPromise<T>(
  fn: (meta: { retryCount: number; retriesLeft: number; retryTimings: number[]; lastRetryTiming: number | null }) => Promise<T>,
  retries = 3,
  retryTimings = [3, 7, 15],
  _retryCount = 0,
): Promise<T> {
  try {
    return fn({
      retryCount: _retryCount,
      retriesLeft: retries,
      retryTimings,
      lastRetryTiming: _retryCount > 0 ? retryTimings[_retryCount - 1] : null,
    });
  } catch (e) {
    if (retries === 0) {
      throw e;
    }

    const waitTime = retryTimings[Math.min(_retryCount, retryTimings.length - 1)];

    await new Promise(r => setTimeout(r, waitTime * 1000));

    return retryPromise(fn, retries - 1, retryTimings, _retryCount + 1);
  }
}
