#!/usr/bin/env bash

rm -rf dist

echo "[ PUBLISH ]: Linting package..."
npm run lint

echo "[ PUBLISH ]: Running tests..."
npm run test

echo "[ PUBLISH ]: Generating build files..."
npm run build

# Switch to public profile to ensure publisher is using public npmrc config
npmrc public-profile

npm publish ./dist
