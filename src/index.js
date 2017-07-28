import {
  addReactiveDirectivesToSchema,
  graphqlReactive,
  executeReactive,
  subscribe,
  defaultFieldResolver,
} from '../graphql/src/index';
import { asyncToObservable, toAsyncIterable } from './utils';

export function graphqlRx(...args) {
  return asyncToObservable(graphqlReactive(...args));
}

export function executeRx(...args) {
  return asyncToObservable(executeReactive(...args));
}

export function subscribeRx(...args) {
  return asyncToObservable(subscribe(...args));
}

export function prepareSchema(schema) {
  addReactiveDirectivesToSchema(schema);
  wrapResolvers(schema);
  return schema;
}

export * from '../graphql/src/index';

function wrapAsyncIterable(fn) {
  return (...args) => toAsyncIterable(fn(...args));
}

function wrapResolvers(schema) {
  const typeMap = schema.getTypeMap();
  const defaultResolver = wrapAsyncIterable(defaultFieldResolver);

  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];

    if ( typeof type.getFields === 'function' ) {
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

// XXX: Should be removed, used for testing.
export { toAsyncIterable } from './utils';
