-- Sample data for local dev. Run with:
--   wrangler d1 execute medway-stamps-db --local --file=./db/seed.sql
-- Admin UI to add real listings is deferred to a later phase (SPEC.md §8).

INSERT INTO stamps
  (id, title, description, country, era, issue_year, sg_number, condition, grade, price_pence, quantity, status, created_at, updated_at)
VALUES
  ('stamp-1', 'Penny Black', 'The world''s first adhesive postage stamp, issued 1840.', 'Great Britain', 'Victoria', 1840, 'SG 2', 'used', 'fine', 45000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-2', 'Two Pence Blue', 'Companion issue to the Penny Black, same year.', 'Great Britain', 'Victoria', 1840, 'SG 5', 'used', 'good', 62000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-3', '1929 PUC £1', 'Postal Union Congress high value, seal of the Congress.', 'Great Britain', 'George V', 1929, 'SG 438', 'mint', 'very fine', 185000, 1, 'available', unixepoch(), unixepoch());

INSERT INTO stamp_tags (stamp_id, tag) VALUES
  ('stamp-1', 'classic'),
  ('stamp-1', 'line-engraved'),
  ('stamp-2', 'classic'),
  ('stamp-3', 'commemorative');
