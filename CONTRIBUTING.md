# Contributing

## Install

Start first by cloning the package and installing the development dependencies:

```sh
cd flecs && yarn
```

## Tests

You can run the tests using:

```sh
yarn test
```

Alternatively, you can run a single file:

```sh
yarn test -- [PATH_TO_FILE]
```

## Development Server

You can start the development server using:

```sh
yarn start
```

This will listen for changes in the `src/` directory.

## Example Server

In order to try your local changes, you can either use the tests, or create
an example making good use of your feature / bug fix.

You can start the web server for the examples with:

```sh
yarn example
```

You can then navigate to `http://localhost:8080/example/[EXAMPLE_NAME]` to try
it out.

## Local Link

In order to link this package to another one, you can either use `npm install`
with a local path, or `npm link`.

Just be careful: the package that is published (and so that you should link)
is in the `dist` folder.

```sh
yarn build
cd dist
yarn link # Link the package generated in the `dist` folder
```

In you local application, you can now use the `flecs` package:

```sh
cd my-app
yarn link flecs
```

```js
import { World } from 'flecs';

// You can use Flecs as if it was a npm-installed dependency
const world = new World();
```
