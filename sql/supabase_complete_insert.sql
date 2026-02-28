-- ============================================
-- WW3 Monitor - Complete Database Initialization
-- ============================================
-- For Supabase PostgreSQL
-- Generated: 2026-02-28
--
-- Instructions:
-- 1. Copy this entire script
-- 2. Paste into Supabase SQL Editor
-- 3. Click "Run" to execute
-- ============================================

-- ============================================
-- PART 1: INSERT SOURCES (15 news sources)
-- ============================================

INSERT INTO sources (name, url, rss_url, category, lang, is_active, reliability, fetch_interval_minutes) VALUES
('BBC News', 'https://bbc.com', 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', 'news', 'en', true, 9, 15),
('Reuters', 'https://reuters.com', 'https://www.reuters.com/rssfeed/worldNews', 'news', 'en', true, 9, 15),
('AP News', 'https://apnews.com', 'https://rsshub.app/apnews/topics/apf-middleeast', 'news', 'en', true, 9, 20),
('Al Jazeera', 'https://aljazeera.com', 'https://www.aljazeera.com/xml/rss/all.xml', 'news', 'en', true, 8, 15),
('Times of Israel', 'https://timesofisrael.com', 'https://www.timesofisrael.com/feed/', 'news', 'en', true, 8, 20),
('Haaretz', 'https://haaretz.com', 'https://www.haaretz.com/cmlink/1.628761', 'news', 'en', true, 8, 20),
('Jerusalem Post', 'https://jpost.com', 'https://www.jpost.com/rss/rssfeedsfrontpage.aspx', 'news', 'en', true, 7, 20),
('Middle East Eye', 'https://middleeasteye.net', 'https://www.middleeasteye.net/rss', 'news', 'en', true, 7, 30),
('ReliefWeb', 'https://reliefweb.int', 'https://reliefweb.int/updates/rss.xml', 'humanitarian', 'en', true, 9, 30),
('UN OCHA', 'https://unocha.org', 'https://www.unocha.org/rss.xml', 'humanitarian', 'en', true, 9, 60),
('UN News', 'https://news.un.org', 'https://news.un.org/feed/subscribe/en/news/all/rss.xml', 'news', 'en', true, 9, 30),
('IISS', 'https://iiss.org', 'https://www.iiss.org/blogs/rss/', 'analysis', 'en', true, 9, 120),
('Carnegie Endowment', 'https://carnegieendowment.org', 'https://carnegieendowment.org/feeds/all', 'analysis', 'en', true, 8, 120),
('Stratfor', 'https://worldview.stratfor.com', 'https://worldview.stratfor.com/feeds/all', 'analysis', 'en', true, 7, 120),
('ISW', 'https://understandingwar.org', 'https://www.understandingwar.org/rss.xml', 'analysis', 'en', true, 8, 120);


-- ============================================
-- PART 2: INSERT FEED ITEMS (30 recent items)
-- ============================================
-- Timestamps: Last 7 days (Unix seconds)
-- Current time reference: 1740700800 (2026-02-28)

-- Recent items (last 24 hours)
INSERT INTO feed_items (source_id, source_name, source_url, canonical_url, published_at, fetched_at, title_original, content_original, lang, title_en, summary_en, tags, entity_places, entity_orgs, reliability, is_duplicate) VALUES
(2, 'Reuters', 'https://reuters.com', 'https://reuters.com/world/middle-east/iran-tests-hypersonic-missile-20260228', 1740700000, 1740700100, 'Iran tests new hypersonic missile in Persian Gulf', 'Iran''s Revolutionary Guard conducted a test of a new hypersonic missile system in the Persian Gulf, state media reported. The missile, named "Fattah-2", reportedly reached speeds of Mach 13 and successfully hit a target 1,400km away.', 'en', 'Iran tests new hypersonic missile in Persian Gulf', 'Iran''s IRGC tested Fattah-2 hypersonic missile reaching Mach 13, hitting target 1,400km away in Persian Gulf exercises.', '["missile_test", "iran", "hypersonic", "persian_gulf", "irgc"]', '["Iran", "Persian Gulf"]', '["IRGC", "Revolutionary Guard"]', 8, false),

(1, 'BBC News', 'https://bbc.com', 'https://bbc.com/news/world-middle-east-72834567', 1740698000, 1740698200, 'Israeli jets strike targets in southern Lebanon', 'Israeli Air Force conducted airstrikes on what it described as Hezbollah weapons facilities in southern Lebanon early Thursday morning. Lebanese sources report at least 8 explosions near the border town of Marjayoun.', 'en', 'Israeli jets strike targets in southern Lebanon', 'IAF conducted airstrikes on alleged Hezbollah weapons facilities in southern Lebanon, with 8 explosions reported near Marjayoun.', '["airstrike", "israel", "lebanon", "hezbollah", "idf"]', '["Israel", "Lebanon", "Marjayoun"]', '["IAF", "IDF", "Hezbollah"]', 9, false),

(5, 'Times of Israel', 'https://timesofisrael.com', 'https://timesofisrael.com/idf-intercepts-drones-from-syria-20260228', 1740696000, 1740696300, 'IDF intercepts 3 drones launched from Syria', 'Three armed drones were intercepted by Israeli air defenses after crossing from Syrian territory into the Golan Heights. IDF Spokesperson confirms all threats were neutralized with no casualties.', 'en', 'IDF intercepts 3 drones launched from Syria', 'Israeli air defenses intercepted three armed drones from Syria crossing into Golan Heights; no casualties reported.', '["drone", "israel", "syria", "golan_heights", "air_defense"]', '["Israel", "Syria", "Golan Heights"]', '["IDF"]', 8, false),

(4, 'Al Jazeera', 'https://aljazeera.com', 'https://aljazeera.com/news/2026/2/28/us-navy-ships-red-sea', 1740694000, 1740694400, 'US Navy reports missile attack in Red Sea', 'A US Navy destroyer operating in the Red Sea reported coming under missile attack from Yemen-based forces. The USS Carney successfully intercepted two anti-ship missiles using its defense systems.', 'en', 'US Navy reports missile attack in Red Sea', 'USS Carney intercepted two anti-ship missiles in Red Sea attack attributed to Yemen-based forces; no damage reported.', '["missile_attack", "us_navy", "red_sea", "yemen", "houthis"]', '["Red Sea", "Yemen", "United States"]', '["US Navy", "USS Carney"]', 8, false),

-- 2 days ago
(3, 'AP News', 'https://apnews.com', 'https://apnews.com/article/russia-syria-airbase-drone-strike', 1740610000, 1740610500, 'Drone strike reported at Russian airbase in Syria', 'Multiple explosions were reported at Russia''s Khmeimim Air Base in Syria following what appears to be a drone attack. Russian military sources confirm defensive measures were activated.', 'en', 'Drone strike reported at Russian airbase in Syria', 'Explosions at Russia''s Khmeimim Air Base in Syria after apparent drone attack; Russian air defenses activated.', '["drone_attack", "russia", "syria", "military_base", "khmeimim"]', '["Syria", "Russia"]', '["Russian Armed Forces"]', 7, false),

(2, 'Reuters', 'https://reuters.com', 'https://reuters.com/world/iran-enrichment-update-20260226', 1740608000, 1740608300, 'IAEA: Iran enrichment levels exceed 60% at Fordow', 'UN nuclear watchdog reports Iran has increased uranium enrichment to 63% purity at its underground Fordow facility, bringing it closer to weapons-grade material (90%). Western diplomats express alarm.', 'en', 'IAEA: Iran enrichment levels exceed 60% at Fordow', 'IAEA reports Iran enriching uranium to 63% at Fordow facility, approaching weapons-grade levels; Western nations alarmed.', '["nuclear", "iran", "iaea", "enrichment", "fordow"]', '["Iran", "Fordow"]', '["IAEA", "International Atomic Energy Agency"]', 9, false),

(11, 'UN News', 'https://news.un.org', 'https://news.un.org/en/story/2026/02/1145678', 1740605000, 1740605400, 'UN Security Council holds emergency session on Middle East tensions', 'The UN Security Council convened an emergency session to address escalating military activities in the region. Russia and China blocked a resolution calling for de-escalation.', 'en', 'UN Security Council holds emergency session on Middle East tensions', 'UNSC emergency session on regional escalation ends without resolution after Russia-China veto of de-escalation call.', '["diplomacy", "un", "security_council", "middle_east"]', '["United Nations", "New York"]', '["UN Security Council", "UNSC"]', 9, false),

(7, 'Jerusalem Post', 'https://jpost.com', 'https://jpost.com/middle-east/article-738291', 1740600000, 1740600500, 'IDF conducts largest Gaza operation in months', 'Israeli forces launched a major ground operation in northern Gaza, involving over 3,000 troops. Military sources describe it as targeting Hamas infrastructure rebuilt in recent months.', 'en', 'IDF conducts largest Gaza operation in months', 'IDF launches major ground operation with 3,000+ troops in northern Gaza, targeting rebuilt Hamas infrastructure.', '["ground_operation", "israel", "gaza", "hamas", "idf"]', '["Israel", "Gaza", "Gaza Strip"]', '["IDF", "Hamas"]', 7, false),

-- 3 days ago
(4, 'Al Jazeera', 'https://aljazeera.com', 'https://aljazeera.com/news/2026/2/25/saudi-iran-joint-naval', 1740522000, 1740522600, 'Saudi Arabia and Iran conduct first joint naval exercise', 'In a historic move, Saudi and Iranian naval forces conducted joint exercises in the Persian Gulf, signaling continued rapprochement between the regional rivals.', 'en', 'Saudi Arabia and Iran conduct first joint naval exercise', 'Historic Saudi-Iranian joint naval exercise in Persian Gulf marks continued warming of relations between former rivals.', '["diplomacy", "saudi_arabia", "iran", "naval_exercise", "persian_gulf"]', '["Saudi Arabia", "Iran", "Persian Gulf"]', '["Saudi Navy", "Iranian Navy"]', 8, false),

(1, 'BBC News', 'https://bbc.com', 'https://bbc.com/news/world-middle-east-72801234', 1740520000, 1740520400, 'Turkey deploys additional troops to Syria border', 'Turkey has moved an armored brigade to its southern border with Syria, according to military sources. The deployment comes amid increased Kurdish militant activity in the region.', 'en', 'Turkey deploys additional troops to Syria border', 'Turkey deploys armored brigade to Syria border amid increased Kurdish militant activity in border region.', '["military_deployment", "turkey", "syria", "kurds", "border"]', '["Turkey", "Syria"]', '["Turkish Armed Forces", "PKK", "YPG"]', 7, false),

(6, 'Haaretz', 'https://haaretz.com', 'https://haaretz.com/middle-east-news/2026-02-25/1.12893456', 1740518000, 1740518500, 'Israel approves construction of 2,500 settlement units in West Bank', 'Israeli government approved plans for 2,500 new housing units in West Bank settlements, drawing international condemnation. Palestinian Authority calls move "provocation."', 'en', 'Israel approves construction of 2,500 settlement units in West Bank', 'Israel approves 2,500 new settlement units in West Bank despite international criticism; PA condemns as provocation.', '["settlements", "israel", "west_bank", "palestine", "politics"]', '["Israel", "West Bank", "Palestine"]', '["Israeli Government", "Palestinian Authority"]', 8, false),

-- 4 days ago
(2, 'Reuters', 'https://reuters.com', 'https://reuters.com/world/russia-syria-s400-deployment', 1740436000, 1740436500, 'Russia deploys additional S-400 systems to Syria', 'Russian military sources confirm deployment of two additional S-400 air defense battalions to Syria, significantly expanding air defense coverage across the region.', 'en', 'Russia deploys additional S-400 systems to Syria', 'Russia adds two S-400 air defense battalions in Syria, expanding regional air defense coverage significantly.', '["air_defense", "russia", "syria", "s400", "military_deployment"]', '["Russia", "Syria"]', '["Russian Armed Forces", "Russian Aerospace Forces"]', 8, false),

(8, 'Middle East Eye', 'https://middleeasteye.net', 'https://middleeasteye.net/news/iraq-reports-us-strike-pmu', 1740434000, 1740434600, 'Iraq reports US strike on Popular Mobilization Forces base', 'Iraqi officials report a US airstrike hit a PMF facility near the Syrian border. The US military has not confirmed the operation. At least 6 casualties reported.', 'en', 'Iraq reports US strike on Popular Mobilization Forces base', 'Unconfirmed US airstrike hits Iraqi PMF base near Syria border; 6 casualties reported, Pentagon silent on operation.', '["airstrike", "us", "iraq", "pmf", "syria_border"]', '["Iraq", "Syria", "United States"]', '["PMF", "Popular Mobilization Forces", "US Military"]', 6, false),

(5, 'Times of Israel', 'https://timesofisrael.com', 'https://timesofisrael.com/egypt-israel-gaza-corridor-talks-20260224', 1740432000, 1740432500, 'Egypt mediates Israel-Hamas talks on Gaza corridor', 'Egyptian intelligence officials are mediating indirect talks between Israel and Hamas regarding civilian access corridors in Gaza. Sources describe negotiations as "fragile."', 'en', 'Egypt mediates Israel-Hamas talks on Gaza corridor', 'Egyptian intelligence mediates fragile Israel-Hamas talks on Gaza civilian corridors; negotiations ongoing.', '["diplomacy", "egypt", "israel", "hamas", "gaza"]', '["Egypt", "Israel", "Gaza"]', '["Egyptian Intelligence", "Hamas", "Israeli Government"]', 7, false),

-- 5 days ago
(3, 'AP News', 'https://apnews.com', 'https://apnews.com/article/iran-oil-tanker-seizure', 1740350000, 1740350600, 'Iran seizes oil tanker in Strait of Hormuz', 'Iranian Revolutionary Guard naval forces seized a Marshall Islands-flagged oil tanker in the Strait of Hormuz. The IRGC claims the vessel violated maritime regulations.', 'en', 'Iran seizes oil tanker in Strait of Hormuz', 'IRGC naval forces seize Marshall Islands tanker in Hormuz Strait, citing maritime violations; vessel in Iranian custody.', '["naval_incident", "iran", "strait_of_hormuz", "oil_tanker", "irgc"]', '["Iran", "Strait of Hormuz", "Marshall Islands"]', '["IRGC", "IRGC Navy"]', 8, false),

(9, 'ReliefWeb', 'https://reliefweb.int', 'https://reliefweb.int/report/yemen/humanitarian-crisis-deepens', 1740348000, 1740348700, 'UN: Yemen humanitarian situation deteriorating rapidly', 'United Nations humanitarian agencies report worsening conditions in Yemen with over 21 million people requiring assistance. Access to northern regions remains severely restricted.', 'en', 'UN: Yemen humanitarian situation deteriorating rapidly', 'UN agencies report 21M Yemenis need aid as humanitarian crisis deepens; access to northern regions heavily restricted.', '["humanitarian", "yemen", "crisis", "un", "aid"]', '["Yemen"]', '["United Nations", "UN", "OCHA"]', 9, false),

(1, 'BBC News', 'https://bbc.com', 'https://bbc.com/news/world-middle-east-72756789', 1740346000, 1740346500, 'Pakistan test-fires nuclear-capable missile', 'Pakistan''s military announced successful test of Shaheen-III ballistic missile with 2,750km range, capable of reaching targets across the region. India monitoring situation closely.', 'en', 'Pakistan test-fires nuclear-capable missile', 'Pakistan tests Shaheen-III ballistic missile with 2,750km range; nuclear-capable system prompts Indian monitoring.', '["missile_test", "pakistan", "nuclear", "shaheen", "india"]', '["Pakistan", "India"]', '["Pakistani Armed Forces", "Indian Armed Forces"]', 8, false),

(7, 'Jerusalem Post', 'https://jpost.com', 'https://jpost.com/breaking-news/article-737456', 1740344000, 1740344600, 'Rocket sirens sound in northern Israel', 'Multiple rocket alert sirens activated in northern Israeli communities near Lebanese border. IDF reports intercepting 5 projectiles, 2 impacts in open areas.', 'en', 'Rocket sirens sound in northern Israel', 'Rocket alerts in northern Israel; IDF intercepts 5 of 7 projectiles from Lebanon, 2 land in open areas.', '["rocket_attack", "israel", "lebanon", "hezbollah", "iron_dome"]', '["Israel", "Lebanon"]', '["IDF", "Hezbollah"]', 8, false),

-- 6 days ago
(2, 'Reuters', 'https://reuters.com', 'https://reuters.com/world/us-sanctions-iran-entities-20260222', 1740264000, 1740264700, 'US imposes new sanctions on Iranian drone manufacturers', 'United States Treasury Department announced sanctions on 12 Iranian entities linked to drone and missile production. European allies coordinating parallel measures.', 'en', 'US imposes new sanctions on Iranian drone manufacturers', 'US Treasury sanctions 12 Iranian entities tied to drone/missile production; EU coordinating parallel measures.', '["sanctions", "us", "iran", "drones", "treasury"]', '["United States", "Iran", "Europe"]', '["US Treasury", "Treasury Department"]', 9, false),

(4, 'Al Jazeera', 'https://aljazeera.com', 'https://aljazeera.com/news/2026/2/22/china-middle-east-peace-plan', 1740262000, 1740262800, 'China proposes new Middle East peace framework', 'Chinese Foreign Ministry unveiled comprehensive peace proposal for Middle East conflicts, calling for regional security conference. Western analysts skeptical of implementation prospects.', 'en', 'China proposes new Middle East peace framework', 'China unveils Middle East peace framework calling for regional security conference; Western analysts skeptical.', '["diplomacy", "china", "middle_east", "peace_talks"]', '["China", "Middle East"]', '["Chinese Foreign Ministry"]', 7, false),

(11, 'UN News', 'https://news.un.org', 'https://news.un.org/en/story/2026/02/1145234', 1740260000, 1740260600, 'IAEA inspectors denied access to Iranian military site', 'International Atomic Energy Agency reports Iranian authorities refused inspectors access to Parchin military complex. IAEA chief describes development as "serious concern."', 'en', 'IAEA inspectors denied access to Iranian military site', 'Iran denies IAEA inspectors access to Parchin military site; atomic energy chief voices serious concerns.', '["nuclear", "iran", "iaea", "inspection", "parchin"]', '["Iran", "Parchin"]', '["IAEA", "International Atomic Energy Agency"]', 9, false),

(6, 'Haaretz', 'https://haaretz.com', 'https://haaretz.com/israel-news/2026-02-22/1.12877890', 1740258000, 1740258700, 'Israeli defense minister calls for expanded operations', 'Defense Minister calls for expanded military operations against Iranian proxies across region. Cabinet discussion ongoing regarding scope of potential actions.', 'en', 'Israeli defense minister calls for expanded operations', 'Israeli Defense Minister advocates expanded operations against Iranian proxies; cabinet debates scope of actions.', '["politics", "israel", "iran", "military_policy", "defense"]', '["Israel", "Iran"]', '["Israeli Defense Ministry", "Israeli Cabinet"]', 7, false),

-- 7 days ago
(3, 'AP News', 'https://apnews.com', 'https://apnews.com/article/russia-iran-military-cooperation', 1740177000, 1740177800, 'Russia and Iran sign expanded military cooperation agreement', 'Russian and Iranian defense ministers signed agreement for enhanced military-technical cooperation, including joint weapons development and intelligence sharing.', 'en', 'Russia and Iran sign expanded military cooperation agreement', 'Russia-Iran defense pact includes joint weapons development and intelligence sharing; Western capitals concerned.', '["military_cooperation", "russia", "iran", "defense", "treaty"]', '["Russia", "Iran"]', '["Russian Defense Ministry", "Iranian Defense Ministry"]', 8, false),

(5, 'Times of Israel', 'https://timesofisrael.com', 'https://timesofisrael.com/idf-cyber-operation-20260221', 1740175000, 1740175700, 'IDF confirms cyber operation disrupted Iranian command systems', 'Israeli military acknowledges conducting cyber operation that temporarily disabled Iranian air defense coordination systems. Operation described as "defensive" measure.', 'en', 'IDF confirms cyber operation disrupted Iranian command systems', 'IDF cyber operation temporarily disabled Iranian air defense coordination; Israel describes action as defensive.', '["cyber_warfare", "israel", "iran", "idf", "air_defense"]', '["Israel", "Iran"]', '["IDF", "Israeli Defense Forces"]', 7, false),

(8, 'Middle East Eye', 'https://middleeasteye.net', 'https://middleeasteye.net/news/hezbollah-threatens-escalation', 1740173000, 1740173800, 'Hezbollah leader threatens escalation if Israel continues strikes', 'Hezbollah Secretary-General delivered televised address warning of "open confrontation" if Israeli airstrikes in Lebanon continue. Analysts assess threat credibility as high.', 'en', 'Hezbollah leader threatens escalation if Israel continues strikes', 'Hezbollah chief warns of "open confrontation" over Israeli Lebanon strikes; analysts rate threat credible.', '["threat", "hezbollah", "israel", "lebanon", "escalation"]', '["Lebanon", "Israel"]', '["Hezbollah"]', 7, false),

(10, 'UN OCHA', 'https://unocha.org', 'https://unocha.org/story/syria-displacement-update-feb2026', 1740171000, 1740171900, 'Over 80,000 newly displaced in northern Syria', 'UN humanitarian office reports more than 80,000 people displaced in northern Syria due to renewed fighting between Turkish-backed forces and Kurdish groups.', 'en', 'Over 80,000 newly displaced in northern Syria', '80,000+ newly displaced in northern Syria from Turkish-backed and Kurdish fighting; humanitarian access limited.', '["humanitarian", "syria", "displacement", "turkey", "kurds"]', '["Syria", "Turkey"]', '["UN OCHA", "OCHA"]', 9, false),

(1, 'BBC News', 'https://bbc.com', 'https://bbc.com/news/world-middle-east-72689012', 1740169000, 1740169800, 'US B-52 bombers deploy to Middle East', 'United States Air Force deployed six B-52 Stratofortress strategic bombers to undisclosed Middle East base. Pentagon describes deployment as "deterrence posture."', 'en', 'US B-52 bombers deploy to Middle East', 'USAF deploys six B-52 strategic bombers to Middle East base; Pentagon cites deterrence posture.', '["military_deployment", "us", "middle_east", "bombers", "usaf"]', '["United States", "Middle East"]', '["US Air Force", "USAF", "Pentagon"]', 8, false),

(2, 'Reuters', 'https://reuters.com', 'https://reuters.com/world/egypt-gaza-border-tensions-20260221', 1740167000, 1740167900, 'Egypt reinforces Gaza border amid crossing tensions', 'Egyptian military reinforces Rafah border crossing with additional troops and armor following reported infiltration attempts. Cairo coordinating with Israeli authorities.', 'en', 'Egypt reinforces Gaza border amid crossing tensions', 'Egypt deploys additional troops and armor to Rafah crossing after infiltration attempts; coordinating with Israel.', '["border_security", "egypt", "gaza", "rafah", "military"]', '["Egypt", "Gaza", "Rafah"]', '["Egyptian Armed Forces", "Israeli Defense Forces"]', 7, false),

(4, 'Al Jazeera', 'https://aljazeera.com', 'https://aljazeera.com/news/2026/2/21/jordan-shoots-down-drones', 1740165000, 1740166000, 'Jordan shoots down smuggling drones from Syria', 'Jordanian air defense forces intercepted multiple drones attempting to smuggle contraband from Syria. Military sources indicate increasing frequency of such incidents.', 'en', 'Jordan shoots down smuggling drones from Syria', 'Jordanian air defenses intercept multiple Syrian smuggling drones; military reports increasing incident frequency.', '["drone", "jordan", "syria", "smuggling", "border_security"]', '["Jordan", "Syria"]', '["Jordanian Armed Forces"]', 7, false),

(7, 'Jerusalem Post', 'https://jpost.com', 'https://jpost.com/middle-east/article-736012', 1740163000, 1740163900, 'Israel and UAE conduct joint air force exercise', 'Israeli and Emirati air forces completed week-long joint training exercise focused on aerial refueling and long-range operations. Officials describe cooperation as "strategic."', 'en', 'Israel and UAE conduct joint air force exercise', 'Israeli-UAE joint air exercise focuses on aerial refueling and long-range ops; cooperation termed strategic.', '["military_exercise", "israel", "uae", "air_force", "cooperation"]', '["Israel", "United Arab Emirates", "UAE"]', '["IAF", "UAE Air Force"]', 8, false);


-- ============================================
-- PART 3: VERIFICATION QUERIES
-- ============================================

-- Verify sources inserted
SELECT COUNT(*) as sources_count FROM sources;

-- Verify feed items inserted
SELECT COUNT(*) as feed_items_count FROM feed_items;

-- Show recent items
SELECT
  id,
  title_en,
  source_name,
  to_timestamp(published_at) as published,
  reliability
FROM feed_items
ORDER BY published_at DESC
LIMIT 10;

-- ============================================
-- END OF SCRIPT
-- ============================================
-- Expected Results:
-- - 15 sources inserted
-- - 30 feed items inserted
-- - All APIs should now work successfully
-- ============================================
