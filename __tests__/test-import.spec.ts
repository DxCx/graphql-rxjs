import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlRx, addReactiveDirectivesToSchema } from '..';
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

      type Subscription {
        counter: Int
      }
      `;

    const resolvers = {
      Subscription: {
        counter(root, args, ctx) {
            return ctx.counterSource;
        },
      },
    };

    const scheme = makeExecutableSchema({typeDefs, resolvers});
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

  it("also works with vanilla graphql objects", () => {
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

    const query = `
      query {
        someInt
      }
    `;

    return graphqlRx(scheme, query, null, { counterSource })
      .bufferCount(3)
      .take(1)
      .toPromise().then((values) => {
        expect(values).toMatchSnapshot();
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
    addReactiveDirectivesToSchema(scheme);

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
});
