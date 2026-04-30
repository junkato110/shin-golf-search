#!/usr/bin/env python3
import json
from datetime import datetime, timezone

# Agent が返したデータ
agent_courses_json = """
{
  "courses": [
    {
      "name": "ゴルフ5カントリー サニーフィールド",
      "nameKana": "ごるふふぁいぶかんとりー さにーふぃーるど",
      "prefecture": "茨城県",
      "city": "常陸大宮市",
      "address": "〒319-2102 茨城県常陸大宮市深泥560",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 7118,
      "openedYear": 1994,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 2,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["高速IC近", "練習場充実", "チャンピオンコース"],
      "hasBath": false,
      "cartFairwayIn": true,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://www.alpen-group.net/sunnyfield/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80052/", "https://reserve.golfdigest.co.jp/golf-course/312104/"]
    },
    {
      "name": "PGM石岡ゴルフクラブ",
      "nameKana": "ぴーじーえむいしおかごるふくらぶ",
      "prefecture": "茨城県",
      "city": "小美玉市",
      "address": "〒319-0102 茨城県小美玉市世楽1050-1",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 7071,
      "openedYear": 1994,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 2,
        "mannerStrictness": 2,
        "practiceRange": 2,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["帝王ニクラウス設計", "トーナメント開催", "名門コース"],
      "hasBath": false,
      "cartFairwayIn": true,
      "caddyType": "選択",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://www.pacificgolf.co.jp/ishioka/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80007/", "https://reserve.golfdigest.co.jp/golf-course/310209/"]
    },
    {
      "name": "ひたちの圀の健楽園",
      "nameKana": "ひたちのくにのけんらくえん",
      "prefecture": "茨城県",
      "city": "常陸大宮市",
      "address": "〒319-3122 茨城県常陸大宮市小瀬沢814",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 6732,
      "openedYear": 1975,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 1,
        "flatness": 1,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["自然活用コース", "複合施設", "宿泊可能"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://kenrakuen.com/", "https://reserve.golfdigest.co.jp/golf-course/310106/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80002/"]
    },
    {
      "name": "アジア下館カントリー倶楽部",
      "nameKana": "あじあしもだてかんとりーくらぶ",
      "prefecture": "茨城県",
      "city": "桜川市",
      "address": "〒309-1226 茨城県桜川市上野原225-4",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 6934,
      "openedYear": 1965,
      "courseLayout": "林間",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 1,
        "flatness": 1,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["林間コース", "自然地形活用", "歴史あるコース"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "必須",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://asia-shimodate.com/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80003/", "https://reserve.golfdigest.co.jp/golf-course/310102/"]
    },
    {
      "name": "アジア取手カントリー倶楽部",
      "nameKana": "あじあとりでかんとりーくらぶ",
      "prefecture": "茨城県",
      "city": "取手市",
      "address": "〒302-0012 茨城県取手市稲1340",
      "holeCount": 27,
      "par": 108,
      "totalYardage": 9458,
      "openedYear": 1964,
      "courseLayout": "河川敷",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["河川敷コース", "27ホール", "クラブバス運行"],
      "hasBath": true,
      "cartFairwayIn": true,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://www.asia-toride.com/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80004", "https://book.alba.co.jp/080004"]
    },
    {
      "name": "アスレチックガーデンゴルフ倶楽部",
      "nameKana": "あすれちっくがーでんごるふくらぶ",
      "prefecture": "茨城県",
      "city": "稲敷市",
      "address": "〒300-0404 茨城県稲敷市東大沼402",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 6902,
      "openedYear": 1995,
      "courseLayout": "林間",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 1,
        "flatness": 2,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["バンカー多数", "戦略的コース", "難易度高"],
      "hasBath": false,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://www.athletic-golf.co.jp/", "https://reserve.golfdigest.co.jp/golf-course/311109/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80032/"]
    },
    {
      "name": "イーグルポイントゴルフクラブ",
      "nameKana": "いーぐるぽいんとごるふくらぶ",
      "prefecture": "茨城県",
      "city": "稲敷郡阿見町",
      "address": "〒300-0401 茨城県稲敷郡阿見町福田1668-5",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 7292,
      "openedYear": 1999,
      "courseLayout": "林間",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 2,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["高速IC近", "高速グリーン", "チャンピオンコース"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://www.eaglepoint.co.jp/", "https://reserve.golfdigest.co.jp/golf-course/310211/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80098/"]
    },
    {
      "name": "オールドオーチャード ゴルフクラブ",
      "nameKana": "おーるどおーちゃーど ごるふくらぶ",
      "prefecture": "茨城県",
      "city": "東茨城郡茨城町",
      "address": "〒311-3134 茨城県東茨城郡茨城町鳥羽田686-3",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 7114,
      "openedYear": 1975,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 2,
        "flatness": 1,
        "mealQuality": 2,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 2,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["丘陵コース", "GPSナビ搭載", "VIPルーム完備"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "必須",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://www.oogc.co.jp/", "https://www.pacificgolf.co.jp/oldorchard/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80021/"]
    },
    {
      "name": "かすみがうらゴルフクラブ",
      "nameKana": "かすみがうらごるふくらぶ",
      "prefecture": "茨城県",
      "city": "かすみがうら市",
      "address": "〒300-0202 茨城県かすみがうら市田伏5136",
      "holeCount": 27,
      "par": 108,
      "totalYardage": 9540,
      "openedYear": 1988,
      "courseLayout": "林間",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 0,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["霞ヶ浦湖畔", "27ホール", "水辺のコース"],
      "hasBath": false,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://reserve.accordiagolf.com/golfCourse/ibaraki/kasumigaura/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80027/", "https://reserve.golfdigest.co.jp/golf-course/311303/"]
    },
    {
      "name": "ひたち大宮ゴルフクラブ",
      "nameKana": "ひたちおおみやごるふくらぶ",
      "prefecture": "茨城県",
      "city": "常陸大宮市",
      "address": "〒319-3521 茨城県常陸大宮市国長2408-1",
      "holeCount": 27,
      "par": 108,
      "totalYardage": 10591,
      "openedYear": 1975,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 2,
        "flatness": 1,
        "mealQuality": 2,
        "mannerStrictness": 1,
        "practiceRange": 2,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["27ホール", "ロッジ併設", "自然に囲まれた"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://kabayagc.com/", "https://reserve.golfdigest.co.jp/golf-course/312205/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80034/"]
    },
    {
      "name": "グランドスラムカントリークラブ",
      "nameKana": "ぐらんどすらむかんとりーくらぶ",
      "prefecture": "茨城県",
      "city": "常陸太田市",
      "address": "〒313-0106 茨城県常陸太田市田渡町823-11",
      "holeCount": 27,
      "par": 108,
      "totalYardage": 10309,
      "openedYear": 1985,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 2,
        "flatness": 1,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["27ホール", "3コース構成", "大規模クラブハウス"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "必須",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://www.pacificgolf.co.jp/grandslam/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80041/", "https://reserve.golfdigest.co.jp/golf-course/311301/"]
    },
    {
      "name": "ゴルフ倶楽部セブンレイクス",
      "nameKana": "ごるふくらぶせぶんれいくす",
      "prefecture": "茨城県",
      "city": "常陸大宮市",
      "address": "〒319-3105 茨城県常陸大宮市北塩子533",
      "holeCount": 27,
      "par": 108,
      "totalYardage": 9735,
      "openedYear": 1988,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 2,
        "flatness": 1,
        "mealQuality": 1,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 2,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["27ホール", "天然温泉", "景観雄大"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://sevenlakes.jp/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80044", "https://reserve.golfdigest.co.jp/golf-course/311501/"]
    },
    {
      "name": "ザ・ゴルフクラブ竜ヶ崎",
      "nameKana": "ざ・ごるふくらぶりゅうがさき",
      "prefecture": "茨城県",
      "city": "龍ケ崎市",
      "address": "〒301-0857 茨城県龍ケ崎市泉町原口1592-77",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 6679,
      "openedYear": 1990,
      "courseLayout": "丘陵",
      "scores": {
        "difficulty": 2,
        "fairwayWidth": 1,
        "flatness": 1,
        "mealQuality": 1,
        "mannerStrictness": 2,
        "practiceRange": 1,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 0,
        "seniorFriendly": 1
      },
      "tags": ["チャンピオンコース", "戦略的レイアウト", "ドレスコード厳格"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "必須",
      "dressCode": "襟付き必須",
      "throughPlay": false,
      "sources": ["https://www.pacificgolf.co.jp/ryugasaki/", "https://reserve.golfdigest.co.jp/golf-course/312106/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80049/"]
    },
    {
      "name": "ザ・ロイヤル ゴルフクラブ",
      "nameKana": "ざ・ろいやる ごるふくらぶ",
      "prefecture": "茨城県",
      "city": "鉾田市",
      "address": "〒311-2117 茨城県鉾田市大蔵200",
      "holeCount": 18,
      "par": 72,
      "totalYardage": 8143,
      "openedYear": 2016,
      "courseLayout": "河川敷",
      "scores": {
        "difficulty": 1,
        "fairwayWidth": 2,
        "flatness": 2,
        "mealQuality": 2,
        "mannerStrictness": 1,
        "practiceRange": 1,
        "onsen": 1,
        "summerCool": 1,
        "winterWarm": 1,
        "windShelter": 1,
        "scenicView": 1,
        "womenFriendly": 1,
        "seniorFriendly": 1
      },
      "tags": ["リゾート施設併設", "温泉完備", "ファクトリーパーク内"],
      "hasBath": true,
      "cartFairwayIn": false,
      "caddyType": "選択",
      "dressCode": "普段着OK",
      "throughPlay": false,
      "sources": ["https://the-royal-golf-club.com/", "https://reserve.golfdigest.co.jp/golf-course/312105/", "https://booking.gora.golf.rakuten.co.jp/guide/disp/c_id/80054/"]
    }
  ]
}
"""

# Load existing courses.json
with open('src/data/courses.json', 'r', encoding='utf-8') as f:
    courses_data = json.load(f)

# Find max ID
max_id = 0
for course in courses_data['courses']:
    id_num = int(course['id'].replace('course_', ''))
    max_id = max(max_id, id_num)

next_id = max_id + 1

# Parse agent data
agent_data = json.loads(agent_courses_json)

# Add courses
added_names = []
for course in agent_data['courses']:
    course_id = f"course_{next_id:03d}"
    course['id'] = course_id
    course['lat'] = None  # Will be filled from candidates later if available
    course['lng'] = None
    course['imageUrl'] = f"/images/{course_id}.jpg"
    course['customImagePrompt'] = f"Professional golf course landscape showing {course['name']}, scenic fairway, championship quality course"
    course['additionalImages'] = [
        {
            "label": "クラブハウス外観",
            "url": f"/images/{course_id}_clubhouse.jpg",
            "prompt": "Japanese golf club house exterior, well-maintained grounds, professional entrance"
        }
    ]
    course['travelMinutesFromTokyo'] = 0  # Will be filled from candidates
    course['updatedAt'] = datetime.now(timezone.utc).isoformat()

    courses_data['courses'].append(course)
    added_names.append(course['name'])
    next_id += 1

# Update courses.json
courses_data['updatedAt'] = datetime.now(timezone.utc).isoformat()
with open('src/data/courses.json', 'w', encoding='utf-8') as f:
    json.dump(courses_data, f, ensure_ascii=False, indent=2)

# Update candidates.json
with open('scripts/candidates.json', 'r', encoding='utf-8') as f:
    candidates_data = json.load(f)

skipped = ["アコーディアガーデン水戸", "ゴルフガーデン ザ・ロンド", "ゴルフ練習", "サンタスワールド", "ゴールデンレイクスカントリークラブ", "オールドオーチャードGC"]

for candidate in candidates_data['candidates']:
    if candidate['name'] in added_names:
        candidate['status'] = 'added'
    elif candidate['name'] in skipped:
        candidate['status'] = 'error'
        candidate['errorReason'] = 'Not a golf course or location mismatch'

candidates_data['generatedAt'] = datetime.now(timezone.utc).isoformat()
with open('scripts/candidates.json', 'w', encoding='utf-8') as f:
    json.dump(candidates_data, f, ensure_ascii=False, indent=2)

print(f"Added {len(added_names)} courses")
print(f"Skipped {len(skipped)} non-courses")
