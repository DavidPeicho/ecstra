export const process = {
  env: {
    NODE_ENV: 'production'
  }
};
const globalProcess = (globalThis as any).process;
if (globalProcess && globalProcess.env && globalProcess.env.NODE_ENV != '') {
  process.env.NODE_ENV = (globalThis as any).process.env.NODE_ENV;
}
