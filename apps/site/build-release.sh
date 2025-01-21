#!/bin/bash

RELEASE_INFO=$(curl -s https://api.github.com/repos/joe307bad/end/releases/latest)

END_COMMIT_SHA=$(echo $RELEASE_INFO | jq -r '.target_commitish')
END_VERSION=$(echo $RELEASE_INFO | jq -r '.name')

export END_COMMIT_SHA
export END_VERSION

echo "END_COMMIT_SHA=$END_COMMIT_SHA"
echo "END_VERSION=$END_VERSION"

./node_modules/.bin/nx build site
