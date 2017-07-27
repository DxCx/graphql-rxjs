import { Observable } from 'rxjs/Observable';
import { $$asyncIterator, getAsyncIterator } from 'iterall';

// TODO: Can be moved into graphql-js and remove pollyfills
export class AsyncGenerator {
	constructor(generatorFunction) {
		this.generator = generatorFunction;
		this.cleanupFunction;
		this.done = false;
		this.sentPromises = [];
		this.completedPromises = [];
	}

	next() {
		if (this.completedPromises.length > 0) {
			return this.completedPromises.shift();
		}

		if ( this.done ) {
			return Promise.resolve({ done: true });
		}

		return new Promise((r, e) => this.sentPromises.push([r, e]));
	}

	throw(e) {
		const p = Promise.reject(e);
		this._cleanup(p);
		return p;
	}

	return() {
		const p = Promise.resolve({ done: true });
		this._cleanup(p);
		return p;
	}

	[$$asyncIterator]() {
		if ( !this.cleanupFunction ) {
			this._invoke();
		}
		return this;
	}

	_cleanup(finalPromise) {
		if ( this.cleanupFunction ) {
			this.cleanupFunction();
			this.cleanupFunction = undefined;
		}

		while (this.sentPromises.length > 0) {
			let [resolve, ] = this.sentPromises.shift();
			resolve(finalPromise);
		}
	}

	_invoke() {
		this.cleanupFunction = this.generator({
			next: (value) => {
				const item = { done: false, value };
				if (this.sentPromises.length > 0) {
					let [resolve, ] = this.sentPromises.shift();

					resolve(item);
				} else {
					this.completedPromises.push(Promise.resolve(item));
				}
			},
			error: (error) => {
				if (this.sentPromises.length > 0) {
					let [, reject] = this.sentPromises.shift();

					reject(error);
				} else {
					this.completedPromises.push(Promise.reject(error));
				}
			},
			complete: () => {
				this.done = true;
				this.cleanupFunction = undefined;
				this._cleanup(Promise.resolve({ done: true }));
			},
		});
	}
}

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
	if ( typeof result.subscribe !== 'function' ) {
		return result;
	}

	return new AsyncGenerator((observer) => {
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
