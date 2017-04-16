import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { addReactiveDirectivesToSchema, graphqlReactive } from '..';

const clockSource = Observable.interval(1000).map(() => new Date()).publishReplay(1).refCount();

const typeDefs = `
# Root Subscription
type Query {
  clock: String
}
`;

const resolvers = {
    Query: {
      clock: (root, args, ctx) => ctx.clockSource,
    },
};

const scheme = makeExecutableSchema({typeDefs, resolvers});
addReactiveDirectivesToSchema(scheme);

const query = `
	query {
		clock
  }
`

const liveQuery = `
	query {
		clock @live
  }
`

graphqlReactive(scheme, query, null, { clockSource })
.subscribe(console.log.bind(console, "standard: "), console.error.bind(console));

graphqlReactive(scheme, liveQuery, null, { clockSource })
.subscribe(console.log.bind(console, "live: "), console.error.bind(console));
