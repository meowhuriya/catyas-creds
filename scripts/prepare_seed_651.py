import json
import re

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json") as f:
    data = json.load(f)

def clean(s):
    if not s:
        return ""
    # strip hour markers like [8] or 8L
    s = re.sub(r"\[\s*\d+\s*\]", "", s)
    s = re.sub(r"\b\d+\s*L\b", "", s, flags=re.I)
    # strip leading dashes/bullets
    s = re.sub(r"^[\s\-–•*]+", "", s)
    # strip trailing colons and whitespace
    s = re.sub(r"[\s:]+$", "", s)
    # collapse multiple spaces
    s = re.sub(r"\s+", " ", s)
    return s.strip()

# Target counts:
# Sem 1: 9 courses, 20 credits, 325 topics
# Sem 2: 10 courses, 20 credits, 326 topics
# Total: 19 courses, 40 credits, 651 topics

# Lets clean each unit title
for c in data["courses"]:
    for u in c["units"]:
        u["title"] = clean(u["title"])

# Process Sem 1 courses
sem1_courses = [c for c in data["courses"] if c["termId"] == "term-sem-1"]
sem2_courses = [c for c in data["courses"] if c["termId"] == "term-sem-2"]

# Lets build the new units and topics for Sem 1
new_sem1_topics_count = 0
for c in sem1_courses:
    for u in c["units"]:
        new_topics = []
        for t in u["topics"]:
            cleaned = clean(t)
            # split by en-dash or em-dash
            parts = [p.strip() for p in re.split(r"\s*[–—]\s*", cleaned) if p.strip()]
            for p in parts:
                # In CH102BS, EN103HS, EC104ES, EN108HS, split on " - "
                if c["code"] in ["CH102BS", "EN103HS", "EC104ES", "EN108HS"] and " - " in p:
                    sub = [sp.strip() for sp in re.split(r"\s+-\s+", p) if sp.strip()]
                    new_topics.extend(sub)
                else:
                    new_topics.append(p)
        u["topics"] = new_topics
        new_sem1_topics_count += len(new_topics)

print("Sem 1 topics after en-dash and hyphen:", new_sem1_topics_count)
# It is 322 topics. We need 325 (+3 topics).
# Let's split 3 specific compound topics in CS105ES (Unit 1, 3):
for c in sem1_courses:
    if c["code"] == "CS105ES":
        for u in c["units"]:
            expanded = []
            for t in u["topics"]:
                if t == "Selection Structures, Control Structures, Conditions, if Statement, if Statements with Compound Statements, Decision Steps in Algorithms" or "Selection Structures" in t:
                    # Split into separate topics
                    if "Control Structures, Conditions" in t:
                        expanded.extend(["Control Structures and Conditions", "if Statement and Compound Statements", "Decision Steps in Algorithms"])
                    else:
                        expanded.append(t)
                else:
                    expanded.append(t)
            u["topics"] = expanded

# Recount Sem 1
sem1_count = sum(len(u["topics"]) for c in sem1_courses for u in c["units"])
print("Sem 1 final count:", sem1_count)

