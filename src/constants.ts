export const process = {
  env: {
    NODE_ENV: 'production'
  }
};
const nodeProcess = (globalThis as any).process;
if (nodeProcess && nodeProcess.env && nodeProcess.env.NODE_ENV != '') {
  const thisEnv = process.env;
  thisEnv.NODE_ENV = nodeProcess.env.NODE_ENV;
}
