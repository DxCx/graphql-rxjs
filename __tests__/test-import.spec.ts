// TODO: Fix properly
import 'babel-core/register';
import 'babel-polyfill';

import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlRx, prepareSchema } from '..';
import { GraphQLInt, GraphQLSchema, GraphQLObjectType } from 'graphql';
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

  // TODO: Reenable when working on Subscription
  it.skip("also works for subscriptions", () => {
    const SubscriptionType = new GraphQLObjectType({
      name: 'Subscription',
      fields: {
        counter: {
          type: GraphQLInt,
          resolve: (root, args, ctx) => {
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
