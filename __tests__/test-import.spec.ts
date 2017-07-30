import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import {
  executeRx,
  subscribeRx,
  graphqlRx,
  prepareSchema,
} from '..';
import {
  parse,
  introspectionQuery,
  GraphQLInt,
  GraphQLSchema,
  GraphQLObjectType,
} from 'graphql';
import 'jest';

const counterSource = Observable.interval(10).publishReplay(1).refCount();

describe('graphql-rxjs import tests', () => {
  it("can work with graphql-tools", () => {
    const typeDefs = `
      # Root Subscription
      type Query {
        someInt: Int
      }
      `;

    const resolvers = {
      Query: {
        someInt(root, args, ctx) {
          return Observable.of(1);
        },
      },
    };

    const scheme = makeExecutableSchema({typeDefs, resolvers});
    prepareSchema(scheme);
    const query = `
      query {
        someInt
      }
    `;

    return graphqlRx(scheme, query)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it("introspectionQuery works as expected", () => {
    const typeDefs = `
      # Root Subscription
      type Query {
        someInt: Int
      }
      `;

    const resolvers = {
      Query: {
        someInt(root, args, ctx) {
          return Observable.of(1);
        },
      },
    };

    const scheme = makeExecutableSchema({typeDefs, resolvers});
    prepareSchema(scheme);

    return graphqlRx(scheme, introspectionQuery)
      .take(1)
      .toPromise().then((values) => {
        expect(values.errors).toBeUndefined();
        expect(values.data).toMatchSnapshot();
    });
  });

  it("also works with vanilla graphql objects", () => {
    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        someInt: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return Observable.of(123);
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
    });
    prepareSchema(scheme);

    const query = `
      query {
        someInt
      }
    `;

    return graphqlRx(scheme, query, null)
      .bufferCount(3)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it("can also query static values", () => {
    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        someInt: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return 123321;
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
    });
    prepareSchema(scheme);

    const query = `
      query {
        someInt
      }
    `;

    return graphqlRx(scheme, query)
      .bufferCount(3)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it("unsubscribe from observable as expected", () => {
    let unsubscribe = false;
    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        counter: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return new Observable((observer) => {
              observer.next(0);
              return () => {
                unsubscribe = true;
              };
            });
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
    });
    prepareSchema(scheme);

    const query = `
      query {
        counter
      }
    `;

    return graphqlRx(scheme, query, null)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
        expect(unsubscribe).toBe(true);
    });
  });

  it("able to add reactive directives to schema", () => {
    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        counter: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return Observable.interval(10);
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
    });
    prepareSchema(scheme);

    const query = `
      query {
        counter @live
      }
    `;

    return graphqlRx(scheme, query, null)
      .bufferCount(10)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it("also works for subscriptions", () => {
    const SubscriptionType = new GraphQLObjectType({
      name: 'Subscription',
      fields: {
        counter: {
          type: GraphQLInt,
          resolve: (root) => root,
          subscribe: (root, args, ctx) => {
            return ctx.counterSource;
          },
        }
      }
    });

    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        someInt: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return 123321;
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
      subscription: SubscriptionType,
    });
    prepareSchema(scheme);

    const query = `
      subscription {
        counter
      }
    `;

    return graphqlRx(scheme, query, null, { counterSource })
      .bufferCount(3)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });
});

describe('import-tests Rx Engines', () => {
  it('subscribeRx works as expected', () => {
    const SubscriptionType = new GraphQLObjectType({
      name: 'Subscription',
      fields: {
        counter: {
          type: GraphQLInt,
          resolve: (root) => root,
          subscribe: (root, args, ctx) => {
            return ctx.counterSource;
          },
        }
      }
    });

    const QueryType = new GraphQLObjectType({
      name: 'Query',
      fields: {
        someInt: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
            return 123321;
          },
        }
      }
    });

    const scheme = new GraphQLSchema({
      query: QueryType,
      subscription: SubscriptionType,
    });
    prepareSchema(scheme);

    const query = `
      subscription {
        counter
      }
    `;

    return subscribeRx(scheme, parse(query), null, { counterSource })
      .bufferCount(3)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it('executeRx works as expected', () => {
    const typeDefs = `
      # Root Subscription
      type Query {
        someInt: Int
      }
      `;

    const resolvers = {
      Query: {
        someInt(root, args, ctx) {
          return Observable.of(1);
        },
      },
    };

    const scheme = makeExecutableSchema({typeDefs, resolvers});
    prepareSchema(scheme);
    const query = `
      query {
        someInt
      }
    `;

    return executeRx(scheme, parse(query))
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
  });

  it("mutation is not allowed to use reactive directives", () => {
    const typeDefs = `
      type Query {
        someInt: Int
      }

      type Mutation {
        shouldntDefer: Int
      }
      `;

    const resolvers = {
      Query: {
        someInt(root, args, ctx) {
          return Observable.of(1);
        },
      },
      Mutation: {
        shouldntDefer(root, args, ctx) {
          return Promise.resolve(1);
        }
      }
    };

    const scheme = makeExecutableSchema({typeDefs, resolvers});
    prepareSchema(scheme);
    const query = `
      mutation {
        shouldntDefer @defer
      }
    `;

    return graphqlRx(scheme, query)
      .toArray().toPromise().then((values) => {
        expect(values).toMatchSnapshot();
    });
});
