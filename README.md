# GraphQL-RxJs

fork of [graphql-js](https://github.com/graphql/graphql-js) which adds Observable support.

## Intro

This package basiclly adds Observables support to a GraphQL resolver.
it is basiclly importing the original graphql-js package for all the code that is not patched,
and provide a reactive execution engine over it.

## Documentation

There is no much to document, all GraphQL documentation are relevant for here.
See more complete documentation at http://graphql.org/ and
http://graphql.org/graphql-js/.

## API

The library exports the following functions:

```typescript
export function graphqlReactive(
  schema: GraphQLSchema,
  requestString: string,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string
): Observable<ExecutionResult>;

export function executeReactive(
  schema: GraphQLSchema,
  document: DocumentNode,
  rootValue?: any,
  contextValue?: any,
  variableValues?: {[key: string]: any},
  operationName?: string
): Observable<ExecutionResult>;
```

they have a signature equal to GraphQL original implementation,
except it returns an observable instead of a promise.
the observable will stream immutable results.

## Getting Started:

Here is a small code chunk shows how the library work:
```typescript
import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlReactive } from 'graphql-rxjs';

const clockSource = Observable.interval(1000).map(() => new Date()).publishReplay(1).refCount();

const typeDef = `
# Root Subscription
type Query {
	someInt: Int
}

type Subscription {
  clock(throttle: Int): String
}
`;

const resolver = {
    Subscription: {
        clock(root, args, ctx) {
            if ( undefined === args.throttle ) {
                return ctx.clockSource;
            } else {
                return ctx.clockSource.throttleTime(args.throttle);
            }
        },
    },
};

const scheme = makeExecutableSchema({typeDefs: typeDef, resolvers: resolver});

const query = `
	subscription {
		clock
  }
`

graphqlReactive(scheme, query, null, { clockSource })
.subscribe(console.log.bind(console), console.error.bind(console));
```

the following code will emit in console:
```
{ data: { clock: 'Thu Feb 02 2017 20:28:27 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:28 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:29 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:30 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:31 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:32 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:33 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:34 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:36 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:37 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:38 GMT+0200 (IST)' } }
{ data: { clock: 'Thu Feb 02 2017 20:28:39 GMT+0200 (IST)' } }
...
```

## Typescript support

just install `@types/graphql` for initial GraphQL support,
then the package will automatically add typings for the new functions it provides.

### Contributing

I am welcoming any pull requests,
if you think something needs to be done, just open an issue or a PR :)

## Versioning

I'll be trying to follow along with `graphql-js` versions,
so basiclly, each graphql-js version should have a working graphql-rxjs package with it.
