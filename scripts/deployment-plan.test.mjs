import assert from 'node:assert/strict';
import test from 'node:test';
import { deploymentPlan } from './deployment-plan.mjs';

test('only master can select production', () => {
  assert.equal(deploymentPlan('master').environment, 'PROD');
  for (const branch of ['feature/master', 'release/master', 'develop', 'main', 'master-old', 'hotfix/example']) assert.notEqual(deploymentPlan(branch).environment, 'PROD');
});
test('develop deploys the stable test Worker', () => {
  assert.equal(deploymentPlan('develop').command, 'deploy --env test --name digitalcardbox-app-test');
});
test('feature and release branches use isolated previews, including nested names', () => {
  for (const branch of ['feature/mvp_iteration_1', 'feature/cards/editor', 'release/2026-10', 'release/pilot/fix']) {
    const plan = deploymentPlan(branch);
    assert.equal(plan.environment, branch.startsWith('feature/') ? 'DEV' : 'TEST');
    assert.match(plan.command, /^preview (?:--config wrangler\.dev\.jsonc --worker-name digitalcardbox-app-dev|--env test --worker-name digitalcardbox-app-test) --name [a-z0-9-]+$/);
    assert.ok(plan.previewName.length + plan.worker.length + 1 <= 63);
  }
});
test('pull requests, tags, missing refs and unsupported branches never deploy', () => {
  for (const plan of [deploymentPlan('master', { event: 'pull_request' }), deploymentPlan('master', { refType: 'tag' }), deploymentPlan('release/1', { event: 'pull_request_target' }), deploymentPlan(undefined), deploymentPlan('feature/'), deploymentPlan('release/'), deploymentPlan('feature/test\ncommand=deploy'), deploymentPlan('main')]) assert.equal(plan.command, '');
});
test('manual reruns retain the branch route', () => {
  assert.equal(deploymentPlan('master', { event: 'workflow_dispatch' }).environment, 'PROD');
  assert.equal(deploymentPlan('release/pilot', { event: 'workflow_dispatch' }).environment, 'TEST');
});
test('similar and long names do not collide or become shell commands', () => {
  const names = ['feature/a_b', 'feature/a-b', 'feature/A-B', 'feature/' + 'a'.repeat(200), 'feature/' + 'a'.repeat(199) + 'b', 'feature/$(touch-something)'];
  const plans = names.map(branch => deploymentPlan(branch));
  assert.equal(new Set(plans.map(plan => plan.previewName)).size, names.length);
  assert.ok(plans.every(plan => /^[a-z0-9-]+$/.test(plan.previewName)));
});
