import assert from 'node:assert/strict';
import { SqliteReviewRepository } from '../../../server/adapters/sqlite.mjs';
import { ReviewApplication } from '../../../server/application.mjs';
import { StudioService } from '../../../server/studio-service.mjs';
import { hash } from '../../../server/domain/identity.mjs';
import { randomUUID } from 'node:crypto';

// Assessment probes use synthetic records in memory only. Assertions document
// the observed defects; a correct fix should invalidate these reproductions.
function newRepository() {
  return new SqliteReviewRepository(':memory:', {
    clock: () => new Date('2026-11-15T17:00:00.000Z'),
  });
}

{
  const repo = newRepository();
  try {
    const app = new ReviewApplication(repo, {});
    const host = repo.host('review-host');
    const session = { host };
    const event = app.createEvent(session, {
      title: 'Synthetic audit event', hosts: 'Synthetic host',
      type: 'Wedding', date: '2026-11-20',
      timezone: 'America/New_York', status: 'published',
    });
    app.saveDestination(session, event.id, {
      service: 'Venmo', identifier: '@synthetic_audit', recipient: 'Synthetic host',
      repeatIdentifier: '@synthetic_audit', checked: true,
      previewOnly: true, enabled: true, version: 0,
    }, event.revision);
    const invite = app.invitation(event.token);
    const result = app.prepareGift(event.token, invite.cookieToken, invite.csrfToken, {
      requestKey: 'gift-lock-probe-0001', service: 'Venmo', version: 1,
      name: 'Synthetic guest', alias: '', amount: '1',
      reference: 'DCB-A1B2C3D4', acknowledged: true,
    });
    const before = repo.ownedEvent(host.id, event.id);
    const changed = app.updateEvent(session, event.id, {
      type: 'Baby shower', date: '2027-04-15',
    }, before.revision);
    assert(result.gift.id);
    assert.equal(before.locked_at, null);
    assert.equal(changed.date, '2027-04-15');
    assert.equal(changed.type, 'Baby shower');
    console.log(JSON.stringify({
      probe: 'gift-first lifecycle lock', reproduced: true,
      giftCreated: true, lockedAt: before.locked_at,
      oldDate: before.date, newDate: changed.date,
      oldType: before.type, newType: changed.type,
      unexpectedUpdateAllowed: true,
    }));
  } finally { repo.close(); }
}

{
  const repo = newRepository();
  try {
    const studio = new StudioService(repo, {});
    repo.transaction(() => {
      for (let i = 0; i < 2000; i++) {
        repo.run('INSERT INTO studio_sessions VALUES(?,?,?)',
          hash('synthetic-expired-' + i), 'csrf-' + i,
          '2020-01-01T00:00:00.000Z');
      }
    });
    const active = repo.one('SELECT count(*) n FROM studio_sessions WHERE expires_at>?', repo.now()).n;
    let failure;
    try { studio.session(null, 'synthetic-local-audit'); }
    catch (error) { failure = error; }
    assert.equal(active, 0);
    assert.equal(failure?.status, 429);
    console.log(JSON.stringify({
      probe: 'expired studio session exhaustion', reproduced: true,
      total: repo.one('SELECT count(*) n FROM studio_sessions').n,
      active, status: failure.status, message: failure.message,
    }));
  } finally { repo.close(); }
}

{
  const repo = newRepository();
  try {
    const host = repo.host('review-host');
    const guest = randomUUID();
    repo.run('INSERT INTO event_guests VALUES(?,?,?)',
      guest, 'test-baby-shower', repo.now());
    repo.transaction(() => {
      for (let i = 0; i < 1001; i++) {
        repo.run('INSERT INTO cards (id,event_id,guest_id,request_key,name,note,style,consent,created_at) VALUES(?,?,?,?,?,?,?,0,?)',
          randomUUID(), 'test-baby-shower', guest, 'audit-' + i,
          'Synthetic guest', 'Synthetic audit note ' + i,
          'little-star', new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString());
      }
    });
    const stored = repo.one("SELECT count(*) n FROM cards c JOIN events e ON e.id=c.event_id WHERE e.owner_id=? AND c.delivery_state='delivered' AND c.removed_at IS NULL", host.id).n;
    const workspace = repo.workspace(host);
    assert.equal(stored, 1004);
    assert.equal(workspace.entries.length, 1000);
    assert(!('hasMore' in workspace));
    assert(!('cursor' in workspace));
    console.log(JSON.stringify({
      probe: 'CardVault export source truncation', reproduced: true,
      storedHostCards: stored, returnedWorkspaceCards: workspace.entries.length,
      missingCards: stored - workspace.entries.length,
      hasPaginationMetadata: false,
    }));
  } finally { repo.close(); }
}
