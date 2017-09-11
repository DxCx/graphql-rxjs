import {
  addReactiveDirectivesToSchema,
  graphqlReactive as graphqlAsync,
  executeReactive as executeAsync,
  subscribe as subscribeAsync,
  validate as originalValidate,
  defaultFieldResolver,
} from '../graphql/src/index';
import { asyncToObservable, toAsyncIterable } from './utils';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';

export * from '../graphql/src/index';
export { AsyncGeneratorFromObserver } from '../graphql/src/utilities/asyncIterator';

export function graphqlReactive(...args) {
  return graphqlAsync(...hookGraphqlArguments(args, false));
}

export function executeReactive(...args) {
  return executeAsync(...hookGraphqlArguments(args, false));
}

export function subscribe(...args) {
  return subscribeAsync(...hookGraphqlArguments(args, true));
}

export function graphqlRx(...args) {
  return Observable.fromPromise(graphqlReactive(...args))
    .flatMap((asyncIterator) => asyncToObservable(asyncIterator));
}

export function executeRx(...args) {
  return asyncToObservable(executeReactive(...args));
}

export function subscribeRx(...args) {
  return Observable.fromPromise(subscribe(...args))
    .flatMap((asyncIterator) => asyncToObservable(asyncIterator));
}

export function validate(...args) {
  if ( args.length > 0 ) {
    args[0] = prepareSchema(args[0]);
  }

  return originalValidate(...args);
}

export function prepareSchema(schema) {
  // XXX: Do we want to duplicate object and modify?
  // or modify original as we are doing now?
  if ( ! schema._reactiveReady ) {
    addReactiveDirectivesToSchema(schema);
    wrapResolvers(schema);
    Object.assign(schema, {
      _reactiveReady: true,
    });
  }

  return schema;
}

function hookGraphqlArguments(args, isSubscription) {
  if (args.length === 1) {
    return hookGraphqlArguments([
      args[0].schema,
      args[0].source || args.document,
      args[0].rootValue,
      args[0].contextValue,
      args[0].variableValues,
      args[0].operationName,
      args[0].fieldResolver,
      args[0].subscribeFieldResolver,
    ], isSubscription);
  }

  const newArgs = Array(
    isSubscription ? 8 : 7
  ).fill(undefined);
  args.forEach((value, i) => { newArgs[i] = value; });

  // Makes sure schema is prepared.
  newArgs[0] = prepareSchema(newArgs[0]);

  // Fixes default resolver for subscription
  let subscribeFieldResolver;
  if ( isSubscription ) {
    subscribeFieldResolver = newArgs.pop();

    if ( !subscribeFieldResolver ) {
      subscribeFieldResolver = defaultFieldResolver;
    }

    subscribeFieldResolver = wrapAsyncIterable(subscribeFieldResolver);
  }

  // Fixes default resolver
  let defaultResolver = newArgs.pop();
  if ( !defaultResolver ) {
    defaultResolver = defaultFieldResolver;
  }
  newArgs.push(wrapAsyncIterable(defaultResolver));
  if ( subscribeFieldResolver ) {
    newArgs.push(subscribeFieldResolver);
  }

  return newArgs;
}

function wrapAsyncIterable(fn) {
  return (...args) => toAsyncIterable(fn(...args));
}

export function wrapResolvers(schema) {
  const typeMap = schema.getTypeMap();
  const defaultResolver = wrapAsyncIterable(defaultFieldResolver);

  Object.keys(typeMap).forEach((typeName) => {
    const type = typeMap[typeName];

    if ( typeof type.getFields === 'function' ) {
      const fields = type.getFields();

      Object.keys(fields).forEach((fieldName) => {
        if ( typeof fields[fieldName].resolve === 'function' ) {
          fields[fieldName].resolve = wrapAsyncIterable(fields[fieldName].resolve);
        }

        if ( typeof fields[fieldName].subscribe === 'function' ) {
          fields[fieldName].subscribe = wrapAsyncIterable(fields[fieldName].subscribe);
        }
      });
    }
  });
}

// XXX: Should be removed, used for testing.
export { toAsyncIterable } from './utils';
