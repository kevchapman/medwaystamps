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

-- 17 more real, well-known British issues spanning Victoria through
-- Elizabeth II, added to give the catalogue more breadth for browsing/
-- search/filter testing.
INSERT INTO stamps
  (id, title, description, country, era, issue_year, sg_number, condition, grade, price_pence, quantity, status, created_at, updated_at)
VALUES
  ('stamp-4', 'Penny Red (Imperforate)', 'Successor to the Penny Black, printed in red so black cancellations would show clearly.', 'Great Britain', 'Victoria', 1841, 'SG 8', 'used', 'good', 6500, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-5', 'Twopence Blue, Large Crown', 'Later printing of the Two Pence Blue without corner letters, watermarked Large Crown.', 'Great Britain', 'Victoria', 1855, 'SG 24', 'used', 'fine', 14000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-6', 'Sixpence Lilac (Emblems)', 'Depicts the floral emblems of the United Kingdom in a compact hexagonal design.', 'Great Britain', 'Victoria', 1867, 'SG 62', 'used', 'fine', 22000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-7', 'Victorian One Shilling Green', 'High-value Victorian definitive with ornate white corner lettering.', 'Great Britain', 'Victoria', 1867, 'SG 117', 'used', 'good', 18000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-8', 'Five Shillings Rose (Golden Jubilee)', 'Top value of the 1887 Golden Jubilee series, marking fifty years of Victoria''s reign.', 'Great Britain', 'Victoria', 1887, 'SG 180', 'mounted_mint', 'fine', 95000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-9', 'Edwardian One Shilling Green', 'Edwardian high-value definitive, continuing the green colour of its Victorian predecessor.', 'Great Britain', 'Edward VII', 1902, 'SG 260', 'used', 'fine', 8500, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-10', 'Two Shillings & Sixpence, Dull Purple & Blue', 'One of the highest denominations issued under Edward VII.', 'Great Britain', 'Edward VII', 1905, 'SG 262', 'used', 'good', 32000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-11', 'Downey Head Penny Scarlet', 'Common George V definitive, named for court photographers W. & D. Downey.', 'Great Britain', 'George V', 1912, 'SG 344', 'mint', 'very fine', 1200, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-12', 'Seahorses Two Shillings & Sixpence', 'Part of the celebrated ''Seahorses'' high-value series, prized for its engraving.', 'Great Britain', 'George V', 1913, 'SG 400', 'mint', 'fine', 120000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-13', 'Seahorses Ten Shillings', 'The top denomination of the Seahorses series, one of the great British classics.', 'Great Britain', 'George V', 1913, 'SG 403', 'used', 'fine', 85000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-14', 'Silver Jubilee One Shilling', 'Issued to mark twenty-five years of George V''s reign.', 'Great Britain', 'George V', 1935, 'SG 456', 'mint', 'very fine', 4000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-15', 'Coronation Three Halfpence', 'Commemorates the 1937 coronation of King George VI.', 'Great Britain', 'George VI', 1937, 'SG 461', 'mint', 'very fine', 800, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-16', 'Silver Wedding £1', 'High-value commemorative marking the silver wedding of King George VI and Queen Elizabeth.', 'Great Britain', 'George VI', 1948, 'SG 494', 'mint', 'fine', 14000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-17', 'Festival of Britain Fourpence', 'Issued for the 1951 Festival of Britain, celebrating post-war recovery.', 'Great Britain', 'George VI', 1951, 'SG 512', 'mint', 'very fine', 1000, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-18', 'Coronation Fourpence', 'Commemorates the 1953 coronation of Queen Elizabeth II.', 'Great Britain', 'Elizabeth II', 1953, 'SG 534', 'mint', 'very fine', 600, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-19', 'Churchill Commemorative Fourpence', 'Issued in 1965 to mark the death of Sir Winston Churchill.', 'Great Britain', 'Elizabeth II', 1965, 'SG 663', 'mint', 'superb', 300, 1, 'available', unixepoch(), unixepoch()),
  ('stamp-20', 'Machin Definitive Fourpence', 'The long-running Machin definitive series, first issued in 1967 and still in use today.', 'Great Britain', 'Elizabeth II', 1967, 'SG 725', 'mint', 'fine', 200, 1, 'available', unixepoch(), unixepoch());

INSERT INTO stamp_tags (stamp_id, tag) VALUES
  ('stamp-4', 'classic'),
  ('stamp-4', 'imperforate'),
  ('stamp-5', 'classic'),
  ('stamp-6', 'emblems'),
  ('stamp-7', 'high-value'),
  ('stamp-8', 'jubilee'),
  ('stamp-8', 'high-value'),
  ('stamp-9', 'definitive'),
  ('stamp-10', 'high-value'),
  ('stamp-11', 'definitive'),
  ('stamp-12', 'seahorses'),
  ('stamp-12', 'high-value'),
  ('stamp-13', 'seahorses'),
  ('stamp-13', 'high-value'),
  ('stamp-14', 'jubilee'),
  ('stamp-14', 'commemorative'),
  ('stamp-15', 'coronation'),
  ('stamp-15', 'commemorative'),
  ('stamp-16', 'commemorative'),
  ('stamp-16', 'high-value'),
  ('stamp-17', 'commemorative'),
  ('stamp-18', 'coronation'),
  ('stamp-18', 'commemorative'),
  ('stamp-19', 'commemorative'),
  ('stamp-20', 'definitive'),
  ('stamp-20', 'machin');
