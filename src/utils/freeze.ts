import { cloneDeepWith } from 'lodash';

export function deepFreeze<T extends object>(obj: T): DeepFrozen<T> {
  return Object.freeze(
    cloneDeepWith(obj, v => {
      if (v && typeof v === 'object') {
        for (const prop in v) {
          v[prop] = deepFreeze(v[prop]);
        }
        return v;
      }
    }),
  );
}

export type DeepFrozen<T extends object> = Readonly<{
  [key in keyof T]: T[key] extends object ? Readonly<DeepFrozen<T[key]>> : Readonly<T[key]>;
}>;
