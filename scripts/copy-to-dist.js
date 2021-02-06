import { existsSync, mkdirSync, promises } from 'fs';
import { resolve } from 'path';

const COPY_REL_FILES = [ 'README.md', 'LICENSE', 'package.json' ];
const DIST_REL_PATH = './dist';

// Creates the build directory if it doesn't exist.
if (!existsSync(DIST_REL_PATH)) {
  mkdirSync(DIST_REL_PATH);
}
// Copies static files to build folder.
for (const file of COPY_REL_FILES) {
  promises.copyFile(file, resolve(DIST_REL_PATH, file));
}
