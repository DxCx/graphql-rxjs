const fs = require('fs');
const path = require('path');

const packageJsonFile = path.resolve('.', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf-8'));
const targetVersion = process.argv.length > 1 && process.argv[2];
if ( !targetVersion ) {
  throw new Error('VERSION argument is not provided, please provide it with M.m.p format');
}

// Patch fields
packageJson.version = `${targetVersion}-0`;
packageJson.peerDependencies.graphql = targetVersion;
packageJson.devDependencies.graphql = targetVersion;

fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2));
