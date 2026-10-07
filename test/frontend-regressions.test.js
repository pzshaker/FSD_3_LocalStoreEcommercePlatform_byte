import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmationView, isPositiveWholeNumber, safeCatalogReturn } from '../src/frontend-utils.js';

test('cancelled confirmations never show collection or payment instructions', () => {
  const view = confirmationView('Cancelled');
  assert.equal(view.showCollection, false);
  assert.match(view.title, /not be prepared/i);
  assert.match(view.message, /restored/i);
});

test('catalog return URLs reject malformed and off-site values', () => {
  assert.equal(safeCatalogReturn('%', 'https://bakery.test'), '/');
  assert.equal(safeCatalogReturn('https://example.com/?category=Bread', 'https://bakery.test'), '/');
  assert.equal(safeCatalogReturn('/?category=Bread&search=roll', 'https://bakery.test'), '/?category=Bread&search=roll');
});

test('cart quantities accept only positive whole numbers', () => {
  assert.equal(isPositiveWholeNumber(2), true);
  assert.equal(isPositiveWholeNumber('2'), true);
  assert.equal(isPositiveWholeNumber(1.5), false);
  assert.equal(isPositiveWholeNumber(0), false);
});
