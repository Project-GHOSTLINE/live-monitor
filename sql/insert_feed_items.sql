-- Feed Items for WW3 Monitor
-- Generated: 2026-02-28
-- Timestamps: Last 7 days (Unix seconds)
-- Current time reference: 1740787200 (2026-02-28 00:00:00 UTC)

-- CRITICAL: Using correct schema with ALL required fields
-- Required: source_id, source_name, source_url, canonical_url, published_at, fetched_at, title_original, lang, reliability, is_duplicate

-- Insert 30 diverse feed items
INSERT INTO feed_items (
  source_id, source_name, source_url, canonical_url,
  published_at, fetched_at, title_original, lang,
  reliability, is_duplicate, title_en, summary_en, tags,
  entity_places, entity_orgs
) VALUES

-- Last 24 hours (most recent)
(2, 'Reuters - World News', 'https://www.reuters.com', 'https://www.reuters.com/world/middle-east/iran-tests-hypersonic-missile-20260228',
1740780000, 1740780300, 'Iran tests new hypersonic missile in Persian Gulf', 'en',
8, 0, 'Iran tests new hypersonic missile in Persian Gulf', 'Iran''s IRGC tested Fattah-2 hypersonic missile reaching Mach 13, hitting target 1,400km away in Persian Gulf.', '["IR", "missile", "military", "test"]',
'["Iran", "Persian Gulf"]', '["IRGC", "Revolutionary Guard"]'),

(1, 'BBC News - Middle East', 'https://www.bbc.com', 'https://www.bbc.com/news/world-middle-east-72834567',
1740775000, 1740775200, 'Israeli jets strike targets in southern Lebanon', 'en',
9, 0, 'Israeli jets strike targets in southern Lebanon', 'IAF conducted airstrikes on alleged Hezbollah weapons facilities in southern Lebanon, 8 explosions near Marjayoun.', '["IL", "airstrike", "military", "lebanon"]',
'["Israel", "Lebanon", "Marjayoun"]', '["IAF", "IDF", "Hezbollah"]'),

(5, 'Times of Israel', 'https://www.timesofisrael.com', 'https://www.timesofisrael.com/idf-intercepts-drones-syria-20260228',
1740770000, 1740770300, 'IDF intercepts 3 drones launched from Syria', 'en',
8, 0, 'IDF intercepts 3 drones launched from Syria', 'Israeli air defenses intercepted three armed drones from Syria crossing into Golan Heights; no casualties.', '["IL", "SY", "drone", "air_defense"]',
'["Israel", "Syria", "Golan Heights"]', '["IDF"]'),

(4, 'Al Jazeera - English', 'https://www.aljazeera.com', 'https://www.aljazeera.com/news/2026/2/28/us-navy-red-sea-attack',
1740765000, 1740765400, 'US Navy reports missile attack in Red Sea', 'en',
8, 0, 'US Navy reports missile attack in Red Sea', 'USS Carney intercepted two anti-ship missiles in Red Sea attack from Yemen-based forces; no damage.', '["US", "YE", "missile", "naval", "houthis"]',
'["Red Sea", "Yemen", "United States"]', '["US Navy", "USS Carney", "Houthis"]'),

-- 2 days ago
(3, 'AP News - Middle East', 'https://www.apnews.com', 'https://www.apnews.com/article/russia-syria-airbase-drone-strike-2026',
1740700000, 1740700500, 'Drone strike reported at Russian airbase in Syria', 'en',
7, 0, 'Drone strike reported at Russian airbase in Syria', 'Explosions at Russia''s Khmeimim Air Base in Syria after apparent drone attack; air defenses activated.', '["RU", "SY", "drone", "military_base"]',
'["Syria", "Russia", "Khmeimim"]', '["Russian Armed Forces"]'),

(2, 'Reuters - World News', 'https://www.reuters.com', 'https://www.reuters.com/world/iran-enrichment-fordow-20260226',
1740695000, 1740695300, 'IAEA: Iran enrichment levels exceed 60% at Fordow', 'en',
9, 0, 'IAEA: Iran enrichment levels exceed 60% at Fordow', 'IAEA reports Iran enriching uranium to 63% at Fordow facility, approaching weapons-grade; Western nations alarmed.', '["IR", "nuclear", "iaea", "enrichment"]',
'["Iran", "Fordow"]', '["IAEA"]'),

(11, 'UN News - Middle East', 'https://news.un.org', 'https://news.un.org/en/story/2026/02/1145678',
1740690000, 1740690400, 'UN Security Council emergency session on Middle East tensions', 'en',
9, 0, 'UN Security Council emergency session on Middle East tensions', 'UNSC emergency session on escalation ends without resolution after Russia-China veto.', '["diplomacy", "un", "security_council"]',
'["United Nations", "New York"]', '["UN Security Council", "UNSC"]'),

(7, 'The Jerusalem Post', 'https://www.jpost.com', 'https://www.jpost.com/middle-east/gaza-operation-20260226',
1740685000, 1740685500, 'IDF conducts largest Gaza operation in months', 'en',
7, 0, 'IDF conducts largest Gaza operation in months', 'IDF launches major ground operation with 3,000+ troops in northern Gaza, targeting Hamas infrastructure.', '["IL", "gaza", "ground_operation", "hamas"]',
'["Israel", "Gaza"]', '["IDF", "Hamas"]'),

-- 3 days ago
(4, 'Al Jazeera - English', 'https://www.aljazeera.com', 'https://www.aljazeera.com/news/2026/2/25/saudi-iran-naval-exercise',
1740610000, 1740610600, 'Saudi Arabia and Iran conduct first joint naval exercise', 'en',
8, 0, 'Saudi Arabia and Iran conduct first joint naval exercise', 'Historic Saudi-Iranian joint naval exercise in Persian Gulf marks warming relations between former rivals.', '["SA", "IR", "diplomacy", "naval", "cooperation"]',
'["Saudi Arabia", "Iran", "Persian Gulf"]', '["Saudi Navy", "Iranian Navy"]'),

(1, 'BBC News - Middle East', 'https://www.bbc.com', 'https://www.bbc.com/news/world-middle-east-turkey-syria-20260225',
1740605000, 1740605400, 'Turkey deploys additional troops to Syria border', 'en',
7, 0, 'Turkey deploys additional troops to Syria border', 'Turkey deploys armored brigade to Syria border amid Kurdish militant activity.', '["TR", "SY", "military", "deployment", "kurds"]',
'["Turkey", "Syria"]', '["Turkish Armed Forces", "YPG"]'),

(6, 'Haaretz', 'https://www.haaretz.com', 'https://www.haaretz.com/israel-news/west-bank-settlements-20260225',
1740600000, 1740600500, 'Israel approves 2,500 new settlement units in West Bank', 'en',
8, 0, 'Israel approves 2,500 new settlement units in West Bank', 'Israel approves 2,500 settlement units in West Bank; PA condemns as provocation.', '["IL", "settlements", "west_bank", "politics"]',
'["Israel", "West Bank", "Palestine"]', '["Israeli Government", "Palestinian Authority"]'),

-- 4 days ago
(2, 'Reuters - World News', 'https://www.reuters.com', 'https://www.reuters.com/world/russia-s400-syria-20260224',
1740525000, 1740525500, 'Russia deploys additional S-400 systems to Syria', 'en',
8, 0, 'Russia deploys additional S-400 systems to Syria', 'Russia adds two S-400 air defense battalions in Syria, expanding regional coverage.', '["RU", "SY", "air_defense", "s400", "deployment"]',
'["Russia", "Syria"]', '["Russian Armed Forces"]'),

(8, 'Middle East Eye', 'https://www.middleeasteye.net', 'https://www.middleeasteye.net/news/iraq-us-strike-pmf-20260224',
1740520000, 1740520600, 'Iraq reports US strike on PMF base near Syria border', 'en',
6, 0, 'Iraq reports US strike on PMF base', 'Unconfirmed US airstrike hits Iraqi PMF base near Syria; 6 casualties, Pentagon silent.', '["US", "IQ", "airstrike", "pmf"]',
'["Iraq", "Syria", "United States"]', '["PMF", "US Military"]'),

(5, 'Times of Israel', 'https://www.timesofisrael.com', 'https://www.timesofisrael.com/egypt-gaza-talks-20260224',
1740515000, 1740515500, 'Egypt mediates Israel-Hamas talks on Gaza corridor', 'en',
7, 0, 'Egypt mediates Israel-Hamas talks on Gaza corridor', 'Egyptian intelligence mediates fragile Israel-Hamas talks on Gaza civilian corridors.', '["EG", "IL", "diplomacy", "hamas", "gaza"]',
'["Egypt", "Israel", "Gaza"]', '["Egyptian Intelligence", "Hamas"]'),

(12, 'UN Security Council', 'https://www.un.org/securitycouncil', 'https://www.un.org/securitycouncil/content/resolution-middle-east-20260224',
1740510000, 1740510300, 'Security Council debates ceasefire resolution for Gaza', 'en',
9, 0, 'Security Council debates Gaza ceasefire resolution', 'UNSC debates humanitarian ceasefire resolution; US signals potential veto.', '["un", "gaza", "ceasefire", "diplomacy"]',
'["United Nations", "Gaza"]', '["UN Security Council"]'),

-- 5 days ago
(3, 'AP News - Middle East', 'https://www.apnews.com', 'https://www.apnews.com/article/iran-tanker-seizure-hormuz-20260223',
1740440000, 1740440600, 'Iran seizes oil tanker in Strait of Hormuz', 'en',
8, 0, 'Iran seizes oil tanker in Strait of Hormuz', 'IRGC naval forces seize Marshall Islands tanker in Hormuz, citing maritime violations.', '["IR", "naval", "strait_of_hormuz", "seizure"]',
'["Iran", "Strait of Hormuz", "Marshall Islands"]', '["IRGC Navy"]'),

(9, 'ReliefWeb - Updates', 'https://reliefweb.int', 'https://reliefweb.int/report/yemen/humanitarian-crisis-feb-2026',
1740435000, 1740435700, 'UN: Yemen humanitarian situation deteriorating rapidly', 'en',
9, 0, 'UN: Yemen humanitarian situation deteriorating', 'UN reports 21M Yemenis need aid; humanitarian crisis deepens, northern access restricted.', '["YE", "humanitarian", "crisis", "aid"]',
'["Yemen"]', '["United Nations", "OCHA"]'),

(1, 'BBC News - Middle East', 'https://www.bbc.com', 'https://www.bbc.com/news/world-south-asia-pakistan-missile-20260223',
1740430000, 1740430500, 'Pakistan test-fires nuclear-capable Shaheen-III missile', 'en',
8, 0, 'Pakistan tests nuclear-capable missile', 'Pakistan tests Shaheen-III ballistic missile with 2,750km range; India monitoring closely.', '["PK", "missile", "nuclear", "test"]',
'["Pakistan", "India"]', '["Pakistani Armed Forces"]'),

(7, 'The Jerusalem Post', 'https://www.jpost.com', 'https://www.jpost.com/breaking-news/rockets-north-israel-20260223',
1740425000, 1740425600, 'Rocket sirens sound in northern Israel', 'en',
8, 0, 'Rocket sirens in northern Israel', 'IDF intercepts 5 of 7 projectiles from Lebanon, 2 land in open areas near border.', '["IL", "rocket", "lebanon", "iron_dome"]',
'["Israel", "Lebanon"]', '["IDF", "Hezbollah"]'),

-- 6 days ago
(2, 'Reuters - World News', 'https://www.reuters.com', 'https://www.reuters.com/world/us-sanctions-iran-drones-20260222',
1740355000, 1740355700, 'US imposes new sanctions on Iranian drone manufacturers', 'en',
9, 0, 'US sanctions Iranian drone manufacturers', 'US Treasury sanctions 12 Iranian entities tied to drone production; EU coordinating measures.', '["US", "IR", "sanctions", "drones"]',
'["United States", "Iran"]', '["US Treasury"]'),

(4, 'Al Jazeera - English', 'https://www.aljazeera.com', 'https://www.aljazeera.com/news/2026/2/22/china-middle-east-peace',
1740350000, 1740350800, 'China proposes new Middle East peace framework', 'en',
7, 0, 'China proposes Middle East peace framework', 'China unveils peace framework calling for regional security conference; Western analysts skeptical.', '["CN", "diplomacy", "middle_east", "peace"]',
'["China", "Middle East"]', '["Chinese Foreign Ministry"]'),

(11, 'UN News - Middle East', 'https://news.un.org', 'https://news.un.org/en/story/2026/02/iaea-iran-parchin',
1740345000, 1740345600, 'IAEA inspectors denied access to Iranian military site', 'en',
9, 0, 'Iran denies IAEA access to Parchin site', 'Iran refuses IAEA inspectors access to Parchin military complex; atomic chief voices concerns.', '["IR", "nuclear", "iaea", "inspection"]',
'["Iran", "Parchin"]', '["IAEA"]'),

(6, 'Haaretz', 'https://www.haaretz.com', 'https://www.haaretz.com/israel-news/defense-minister-iran-proxies-20260222',
1740340000, 1740340700, 'Israeli defense minister calls for expanded operations vs Iranian proxies', 'en',
7, 0, 'Israeli defense chief calls for expanded operations', 'Defense Minister advocates expanded operations against Iranian proxies; cabinet debates scope.', '["IL", "IR", "politics", "military_policy"]',
'["Israel", "Iran"]', '["Israeli Defense Ministry"]'),

(10, 'UN OCHA - News', 'https://www.unocha.org', 'https://www.unocha.org/story/lebanon-displacement-update-feb2026',
1740335000, 1740335900, 'Over 45,000 displaced in southern Lebanon', 'en',
9, 0, 'Southern Lebanon sees 45,000 displaced', '45,000+ displaced in southern Lebanon due to cross-border strikes; humanitarian access limited.', '["LB", "humanitarian", "displacement"]',
'["Lebanon"]', '["UN OCHA"]'),

-- 7 days ago
(3, 'AP News - Middle East', 'https://www.apnews.com', 'https://www.apnews.com/article/russia-iran-defense-cooperation-20260221',
1740270000, 1740270800, 'Russia and Iran sign expanded military cooperation agreement', 'en',
8, 0, 'Russia-Iran sign military cooperation pact', 'Russia-Iran defense pact includes joint weapons development and intelligence sharing.', '["RU", "IR", "military", "cooperation", "treaty"]',
'["Russia", "Iran"]', '["Russian Defense Ministry", "Iranian Defense Ministry"]'),

(5, 'Times of Israel', 'https://www.timesofisrael.com', 'https://www.timesofisrael.com/idf-cyber-iran-operation-20260221',
1740265000, 1740265700, 'IDF confirms cyber operation disrupted Iranian air defense systems', 'en',
7, 0, 'IDF cyber op disrupted Iranian air defenses', 'IDF cyber operation temporarily disabled Iranian air defense coordination; described as defensive.', '["IL", "IR", "cyber", "air_defense"]',
'["Israel", "Iran"]', '["IDF"]'),

(8, 'Middle East Eye', 'https://www.middleeasteye.net', 'https://www.middleeasteye.net/news/hezbollah-escalation-threat-20260221',
1740260000, 1740260800, 'Hezbollah leader threatens escalation over Israeli strikes', 'en',
7, 0, 'Hezbollah threatens escalation over Israeli strikes', 'Hezbollah chief warns of "open confrontation" over Israeli Lebanon strikes; threat deemed credible.', '["LB", "IL", "hezbollah", "threat", "escalation"]',
'["Lebanon", "Israel"]', '["Hezbollah"]'),

(10, 'UN OCHA - News', 'https://www.unocha.org', 'https://www.unocha.org/story/syria-displacement-idlib-feb2026',
1740255000, 1740255900, 'Over 80,000 newly displaced in northern Syria', 'en',
9, 0, 'Northern Syria: 80,000 newly displaced', '80,000+ displaced in northern Syria from Turkish-Kurdish fighting; humanitarian access limited.', '["SY", "humanitarian", "displacement", "kurds"]',
'["Syria", "Turkey"]', '["UN OCHA"]'),

(1, 'BBC News - Middle East', 'https://www.bbc.com', 'https://www.bbc.com/news/world-middle-east-us-b52-deployment-20260221',
1740250000, 1740250800, 'US deploys B-52 strategic bombers to Middle East', 'en',
8, 0, 'US deploys B-52 bombers to Middle East', 'USAF deploys six B-52 strategic bombers to Middle East; Pentagon cites deterrence posture.', '["US", "military", "deployment", "bombers"]',
'["United States", "Middle East"]', '["US Air Force", "Pentagon"]'),

(2, 'Reuters - World News', 'https://www.reuters.com', 'https://www.reuters.com/world/egypt-gaza-border-rafah-20260221',
1740245000, 1740245900, 'Egypt reinforces Gaza border after infiltration attempts', 'en',
7, 0, 'Egypt reinforces Gaza border at Rafah', 'Egypt deploys troops and armor to Rafah after infiltration attempts; coordinating with Israel.', '["EG", "gaza", "border", "security"]',
'["Egypt", "Gaza", "Rafah"]', '["Egyptian Armed Forces", "IDF"]'),

(4, 'Al Jazeera - English', 'https://www.aljazeera.com', 'https://www.aljazeera.com/news/2026/2/21/jordan-drones-syria',
1740240000, 1740241000, 'Jordan intercepts smuggling drones from Syria', 'en',
7, 0, 'Jordan shoots down Syrian smuggling drones', 'Jordanian air defenses intercept multiple Syrian smuggling drones; incident frequency increasing.', '["JO", "SY", "drone", "smuggling", "border"]',
'["Jordan", "Syria"]', '["Jordanian Armed Forces"]');
