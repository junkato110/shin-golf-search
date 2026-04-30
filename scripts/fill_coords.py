#!/usr/bin/env python3
import json

# Load data
with open('scripts/candidates.json', 'r', encoding='utf-8') as f:
    candidates_data = json.load(f)

with open('src/data/courses.json', 'r', encoding='utf-8') as f:
    courses_data = json.load(f)

# Build candidate map by name
candidate_map = {}
for cand in candidates_data['candidates']:
    candidate_map[cand['name']] = cand

# Fill coords and travelMinutesFromTokyo
for course in courses_data['courses']:
    if course['name'] in candidate_map:
        cand = candidate_map[course['name']]
        if cand.get('lat') is not None:
            course['lat'] = cand['lat']
        if cand.get('lng') is not None:
            course['lng'] = cand['lng']
        if cand.get('travelMinutesFromTokyo'):
            course['travelMinutesFromTokyo'] = cand['travelMinutesFromTokyo']

with open('src/data/courses.json', 'w', encoding='utf-8') as f:
    json.dump(courses_data, f, ensure_ascii=False, indent=2)

print("Coordinates filled")
