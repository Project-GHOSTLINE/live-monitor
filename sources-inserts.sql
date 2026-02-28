-- ============================================================
-- Sources INSERT Statements
-- Based on existing SQLite database data
-- Generated: 2026-02-28
-- ============================================================

INSERT INTO sources (id, name, url, source_type, reliability, language, rate_limit_seconds, is_active, created_at) VALUES
  (1, 'BBC News - Middle East', 'http://feeds.bbci.co.uk/news/world/middle_east/rss.xml', 'mainstream', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (2, 'Reuters - World News', 'https://www.reutersagency.com/feed/?taxonomy=best-topics&post_type=best', 'mainstream', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (3, 'AP News - Middle East', 'https://feedx.net/rss/ap.xml', 'mainstream', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (4, 'Al Jazeera - English', 'https://www.aljazeera.com/xml/rss/all.xml', 'regional', 4, 'en', 300, true, extract(epoch from now())::bigint),
  (5, 'Times of Israel', 'https://www.timesofisrael.com/feed/', 'regional', 4, 'en', 300, true, extract(epoch from now())::bigint),
  (6, 'Haaretz', 'https://www.haaretz.com/cmlink/1.628752', 'regional', 4, 'en', 300, true, extract(epoch from now())::bigint),
  (7, 'The Jerusalem Post', 'https://www.jpost.com/rss/rssfeedsheadlines.aspx', 'regional', 4, 'en', 300, true, extract(epoch from now())::bigint),
  (8, 'Middle East Eye', 'https://www.middleeasteye.net/rss', 'regional', 4, 'en', 300, true, extract(epoch from now())::bigint),
  (9, 'ReliefWeb - Updates', 'https://reliefweb.int/updates/rss.xml', 'humanitarian', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (10, 'UN OCHA - News', 'https://www.unocha.org/rss.xml', 'humanitarian', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (11, 'UN News - Middle East', 'https://news.un.org/feed/subscribe/en/news/region/middle-east/feed/rss.xml', 'official', 5, 'en', 300, true, extract(epoch from now())::bigint),
  (12, 'UN Security Council', 'https://www.un.org/press/en/content/security-council/rss', 'official', 5, 'en', 300, true, extract(epoch from now())::bigint);

-- Reset sequence to continue from 13
SELECT setval('sources_id_seq', 12, true);
