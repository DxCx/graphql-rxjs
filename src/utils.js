import { Observable } from 'rxjs/Observable';
import { AsyncGeneratorFromObserver } from '../graphql/src/utilities/asyncIterator';
import { $$asyncIterator, getAsyncIterator } from 'iterall';

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
        iterator.return.call(iterator);
      }
    };
  });
}

export function toAsyncIterable(result) {
  if ( !result ) {
    return result;
  }

  if ( typeof result.subscribe !== 'function' ) {
    return result;
  }

  return AsyncGeneratorFromObserver((observer) => {
    let subscription = result.subscribe(
      (x) => observer.next(x),
      (e) => observer.error(e),
      () => observer.complete(),
    );

    return () => {
      if ( subscription ) {
        subscription.unsubscribe();
        subscription = undefined;
      }
    };
  });
}
