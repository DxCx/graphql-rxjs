import {
  addReactiveDirectivesToSchema,
  graphqlReactive,
  executeReactive,
  defaultFieldResolver,
} from '../graphql/src/index.js';
import { createAsyncIterator, $$asyncIterator, getAsyncIterator } from 'iterall';
import { Observable } from 'rxjs/Observable';
import { wrapObservable } from 'async-generator';

function asyncToObservable(asyncIterable) {
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

function toAsyncIterable(result) {
  if ( typeof result.subscribe !== 'function' ) {
    return result;
  }

  return createAsyncIterator(wrapObservable(result));
}

function wrapAsyncIterable(fn) {
  return (...args) => toAsyncIterable(fn(...args));
}

function wrapResolvers(schema) {
  const typeMap = schema.getTypeMap();
  const defaultResolver = wrapAsyncIterable(defaultFieldResolver);

  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];

    if ( typeof type.getFields === 'function' ) {
      // modify copy
      const fields = type.getFields();
      Object.keys(fields).forEach((fieldName) => {
        if ( typeof fields[fieldName].resolve === 'function' ) {
          fields[fieldName].resolve = wrapAsyncIterable(fields[fieldName].resolve);
        } else {
          fields[fieldName].resolve = defaultResolver;
        }

        if ( typeof fields[fieldName].subscribe === 'function' ) {
          fields[fieldName].subscribe = wrapAsyncIterable(fields[fieldName].subscribe);
        }
        // TODO: Default resolver for subscribe as well?
      });
    }
  });
}

export function graphqlRx(...args) {
  return asyncToObservable(graphqlReactive(...args));
}

export function executeRx(...args) {
  return asyncToObservable(executeReactive(...args));
}

export function prepareSchema(schema) {
  addReactiveDirectivesToSchema(schema);
  wrapResolvers(schema);
  return schema;
}

export * from '../graphql/src/index.js';
