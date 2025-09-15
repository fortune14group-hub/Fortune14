import test from 'node:test';
import assert from 'node:assert/strict';

// Mock environment variables to satisfy imports in stripe-webhook.js
process.env.SUPABASE_URL = 'https://example.com';
process.env.SUPABASE_SERVICE_ROLE = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';

const { isActiveSubscription } = await import('./stripe-webhook.js');

test('isActiveSubscription returns true for active statuses', () => {
  for (const status of ['trialing', 'active', 'past_due', 'unpaid']) {
    assert.equal(isActiveSubscription(status), true, `${status} should be active`);
  }
});

test('isActiveSubscription returns false for inactive statuses', () => {
  for (const status of ['incomplete', 'incomplete_expired', 'canceled', 'paused']) {
    assert.equal(isActiveSubscription(status), false, `${status} should be inactive`);
  }
});
