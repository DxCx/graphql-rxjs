import { Observable } from 'rxjs';
import { makeExecutableSchema } from 'graphql-tools';
import { addReactiveDirectivesToSchema, graphqlReactive } from '..';

const remoteString = new Promise((resolve, reject) => {
  setTimeout(() => resolve('Hello World!'), 5000);
});

const typeDefs = `
# Root Subscription
type Query {
	remoteString: String
}
`;

const resolvers = {
    Query: {
      remoteString: (root, args, ctx) => ctx.remoteString,
    },
};

const scheme = makeExecutableSchema({typeDefs, resolvers});
addReactiveDirectivesToSchema(scheme);

const query = `
	query {
		remoteString @defer
  }
`

const log = (result) => console.log("[" + (new Date).toLocaleTimeString() + "] " + JSON.stringify(result));

graphqlReactive(scheme, query, null, { remoteString })
.subscribe(log, console.error.bind(console));
