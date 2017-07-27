import { Observable } from 'rxjs/Observable';
import { wrapObservable } from 'async-generator';
import { createAsyncIterator, getAsyncIterator } from 'iterall';

export function asyncToObservable(asyncIterable) {
  return Observable.create((observer) => {
    const iterator = getAsyncIterator(asyncIterable);

    const errorHandler = (error) => observer.error(error);
    const nextHandler = (result) => {
      if ( result.done ) {
        observer.complete();
        return;
      }

      observer.next(result.value);
      return iterator.next().then(nextHandler, errorHandler);;
    };

    iterator.next().then(nextHandler, errorHandler);
    return () => {
      if ( typeof iterator.return === 'function' ) {
        iterator.return();
      }
    };
  });
}

export function toAsyncIterable(result) {
  if ( typeof result.subscribe !== 'function' ) {
    return result;
  }

  return createAsyncIterator(wrapObservable(result));
}
