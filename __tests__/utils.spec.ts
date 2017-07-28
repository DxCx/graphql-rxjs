import * as root from '..';
import { Observable } from 'rxjs';
import { getAsyncIterator } from 'iterall';

const toAsyncIterable = (<any>root).toAsyncIterable;

async function asyncToArray(iterable, limit?) {
  const responses = [];
  const infiateLoop = true;
  const iter = getAsyncIterator(iterable);

  while (infiateLoop) {
    const result = await iter.next(); // eslint-disable-line no-await-in-loop

    if ( result.done ) {
      break;
    }

    responses.push(result.value);
    if ( (limit !== undefined) && (responses.length >= limit) ) {
      iter.return();
      break;
    }
  }

  return responses;
}

describe('toAsyncIterable', () => {
  it('passes sanity', async () => {
    const iterable = toAsyncIterable(Observable.of(1));
    const result = await asyncToArray(iterable);

    expect(result).toEqual([1]);
  });

  it('works for more then one value', async () => {
    const iterable = toAsyncIterable(Observable.interval(10));
    const result = await asyncToArray(iterable, 3);

    expect(result).toEqual([0, 1, 2]);
  });
});
