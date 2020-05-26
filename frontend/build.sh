#!/bin/sh
set -o errexit
set -o pipefail
set -o nounset

rm -rf build/
yarn install
yarn build
cd build
mkdir root
mv *.ico *.js *.json root
