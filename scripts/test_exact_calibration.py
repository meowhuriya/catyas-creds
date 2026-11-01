import json
import re

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json") as f:
    data = json.load(f)

def clean(s):
    if not s:
        return ""
    s = re.sub(r"\[\s*\d+\s*\]", "", s)
    s = re.sub(r"\b\d+\s*L\b", "", s, flags=re.I)
    s = re.sub(r"^[\s\-–•*]+", "", s)
    s = re.sub(r"[\s:]+$", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

for c in data["courses"]:
    for u in c["units"]:
        u["title"] = clean(u["title"])

# Clean junk from CS205ES Unit 5
for c in data["courses"]:
    if c["code"] == "CS205ES":
        for u in c["units"]:
            if u["unitNumber"] == 5:
                cleaned_topics = []
                for t in u["topics"]:
                    if any(j in t for j in ["TEXTBOOKS", "Cengage Learning", "Oxford University", "REFERENCE", "PH206BS", "Course Objectives", "Course Outcomes", "B.Tech"]):
                        continue
                    cleaned_topics.append(t)
                u["topics"] = cleaned_topics

# Clean junk from PH206BS Unit 4 & Unit 6
for c in data["courses"]:
    if c["code"] == "PH206BS":
        valid_units = []
        for u in c["units"]:
            if "Course Outcomes" in u["title"] or "Any 8 experiments" in u["title"]:
                continue
            cleaned_topics = []
            for t in u["topics"]:
                if any(j in t for j in ["B.Tech", "Course Outcomes"]):
                    continue
                cleaned_topics.append(t)
            u["topics"] = cleaned_topics
            valid_units.append(u)
        c["units"] = valid_units

print("Cleaned junk.")
