#!/bin/bash
set -e
if [ -z ${1+x} ]; then echo "version argument not given, please state M.m.p"; exit 1; fi
VERSION=v${1}-0
echo "Updating package to ${VERSION}"

git remote update origin
git pull origin master

# Update package.json
node ./resources/patchVersion.js ${1}

# Update Submodule repo
cd graphql
git remote update origin
TARGET_BRANCH=rxjs-v${1}
BRANCH_NAME=`git symbolic-ref HEAD 2>/dev/null` || BRANCH_NAME='refs/head/'
BRANCH_NAME=${BRANCH_NAME##refs/heads/}
if [ "${BRANCH_NAME}" != "${TARGET_BRANCH}" ]; then
	git branch -D ${TARGET_BRANCH} || true;
	git checkout -t origin/${TARGET_BRANCH};
fi
cd ../

# Test the output
rm -Rf node_modules/
npm install
# npm install runs also npm test

# Generate version branch
git checkout -b ${VERSION}
git add graphql
git add package.json
git commit -m "chore(package): ${VERSION}"
git tag ${VERSION}
git push -u origin HEAD:${VERSION} --tags

echo "RUN npm publish To finish the process after CI approves"
