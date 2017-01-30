graphql = require('graphql');
//require('./register');
//console.log(graphql.executeReactive);
pkg = require('./index');
console.log(pkg.GraphQLSchema === graphql.GraphQLSchema);
