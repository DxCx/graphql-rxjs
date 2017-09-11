const path = require('path');
const moveSync = require('fs-extra').moveSync;
const fs = require('fs');
const execFileSync = require('child_process').execFileSync;

console.log('Executing npm install of graphql');
console.log(execFileSync('yarn', [
  'install',
], { encoding: 'utf-8', cwd: path.join(__dirname, '..', 'graphql') }));

const thisModulesPath = path.join(__dirname, '..', 'node_modules');
const graphqlModulesPath = path.join(__dirname, '..', 'graphql', 'node_modules');
const thisDeps = fs.readdirSync(thisModulesPath);
const graphqlDeps = fs.readdirSync(graphqlModulesPath);
const missingDeps = graphqlDeps
  .filter((i) => false === i.startsWith('.'))
  .filter((i) => thisDeps.indexOf(i) === -1);

missingDeps.forEach((depName) => {
  const thisPath = path.join(thisModulesPath, depName);
  const graphqlPath = path.join(graphqlModulesPath, depName);
  fs.symlinkSync(graphqlPath, thisPath, 'dir');
});
