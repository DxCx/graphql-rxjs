import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlReactive } from '..';

const clockSource = Observable.interval(1000).map(() => new Date()).publishReplay(1).refCount();

const typeDefs = `
# Root Subscription
type Query {
	someInt: Int
}

type Subscription {
  clock(throttle: Int): String
}
`;

const resolvers = {
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

const scheme = makeExecutableSchema({typeDefs, resolvers});

const query = `
	subscription {
		clock
  }
`

graphqlReactive(scheme, query, null, { clockSource })
.subscribe(console.log.bind(console), console.error.bind(console));
