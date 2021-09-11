import prettyMs from 'pretty-ms';

export function wait<T>(numSeconds: number, v: T): Promise<T> {
  return new Promise(function (resolve) {
    setTimeout(resolve.bind(null, v), numSeconds * 1000);
  });
}


export function timeToText(timeInSec: number, options?: prettyMs.Options): string {
  return prettyMs(Math.floor(timeInSec) * 1000, options);
}

export function bitMaskMatch(value: number | undefined, bit: number): boolean {
  return value === undefined ? false : (value & Math.pow(2, bit)) == Math.pow(2, bit);
}
