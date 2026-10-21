import { createHash } from 'node:crypto';
import { appendFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function deploymentPlan(branch, { event = 'push', refType = 'branch' } = {}) {
  const none = { environment: '', wranglerEnvironment: '', worker: '', previewName: '', command: '' };
  if (!['push', 'workflow_dispatch'].includes(event) || refType !== 'branch' || typeof branch !== 'string' || /[\r\n\0]/.test(branch)) return none;
  if (branch === 'master') return { environment: 'PROD', wranglerEnvironment: 'prod', worker: 'digitalcardbox-app', previewName: '', command: 'deploy --env prod --name digitalcardbox-app' };
  if (branch === 'develop') return { environment: 'TEST', wranglerEnvironment: 'test', worker: 'digitalcardbox-app-test', previewName: '', command: 'deploy --env test --name digitalcardbox-app-test' };
  const prefix = branch.startsWith('feature/') ? 'feature' : branch.startsWith('release/') ? 'release' : '';
  if (!prefix || !branch.slice(prefix.length + 1)) return none;
  const environment = prefix === 'feature' ? 'DEV' : 'TEST';
  const wranglerEnvironment = prefix === 'feature' ? 'dev' : 'test';
  const worker = `digitalcardbox-app-${wranglerEnvironment}`;
  const slug = branch.slice(prefix.length + 1).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 18).replace(/-+$/g, '') || 'branch';
  const hash = createHash('sha256').update(branch).digest('hex').slice(0, 8);
  const previewName = `${prefix}-${slug}-${hash}`;
  return { environment, wranglerEnvironment, worker, previewName, command: `preview ${environment === "DEV" ? "--config wrangler.dev.jsonc" : "--env test"} --worker-name ${worker} --name ${previewName}` };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const plan = deploymentPlan(process.env.GITHUB_REF_NAME, { event: process.env.GITHUB_EVENT_NAME, refType: process.env.GITHUB_REF_TYPE });
  const output = Object.entries(plan).map(([key, value]) => `${key}=${value}`).join('\n') + '\n';
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, output);
  else process.stdout.write(output);
}
