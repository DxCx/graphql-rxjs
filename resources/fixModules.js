const path = require('path');
const { moveSync } = require('fs-extra');
const { symlinkSync, readdirSync } = require('fs');
const { execFileSync } = require('child_process');

console.log('Executing npm install of graphql');
console.log(execFileSync('npm', [
  'install',
], { encoding: 'utf-8', cwd: path.join(__dirname, '..', 'graphql') }));

const thisModulesPath = path.join(__dirname, '..', 'node_modules');
const graphqlModulesPath = path.join(__dirname, '..', 'graphql', 'node_modules');
const thisDeps = readdirSync(thisModulesPath);
const graphqlDeps = readdirSync(graphqlModulesPath);
const missingDeps = graphqlDeps
  .filter((i) => false === i.startsWith('.'))
  .filter((i) => thisDeps.indexOf(i) === -1);

missingDeps.forEach((depName) => {
  const thisPath = path.join(thisModulesPath, depName);
  const graphqlPath = path.join(graphqlModulesPath, depName);
  symlinkSync(graphqlPath, thisPath, 'dir');
});
