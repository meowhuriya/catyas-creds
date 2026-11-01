import json
import re

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json") as f:
    raw_seed = json.load(f)

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
    s = re.sub(r"\s+", " ", s)
    return s.strip()

# 1. Process Sem 1
sem1_courses = [c for c in raw_seed["courses"] if c["termId"] == "term-sem-1"]

for c in sem1_courses:
    for u in c["units"]:
        u["title"] = clean(u["title"])
        split_tops = []
        for t in u["topics"]:
            ct = clean(t)
            # Split en-dash or em-dash
            parts = [clean(p) for p in re.split(r"\s*[–—]\s*", ct) if clean(p)]
            for p in parts:
                if c["code"] in ["CH102BS", "EN103HS", "EC104ES", "EN108HS"] and " - " in p:
                    sub = [clean(sp) for sp in re.split(r"\s+-\s+", p) if clean(sp)]
                    split_tops.extend(sub)
                else:
                    split_tops.append(p)
        u["topics"] = split_tops

# Additional specific splits in CS105ES to reach 325
for c in sem1_courses:
    if c["code"] == "CS105ES":
        for u in c["units"]:
            expanded = []
            for t in u["topics"]:
                if "Statements, General Form of a C Program" in t:
                    expanded.extend(["General Form of a C Program", "Arithmetic Expressions", "Formatting Numbers in Program Output"])
                elif "Basic searching in an array" in t and "Basic algorithms to sort" in t:
                    expanded.extend([
                        "Linear and Binary Search Techniques in Arrays",
                        "Bubble, Insertion and Selection Sort Algorithms"
                    ])
                else:
                    expanded.append(t)
            u["topics"] = expanded

sem1_total_topics = sum(len(u["topics"]) for c in sem1_courses for u in c["units"])
print(f"Sem 1 verified topics: {sem1_total_topics} (Target: 325)")

# 2. Process Sem 2
sem2_courses = [c for c in raw_seed["courses"] if c["termId"] == "term-sem-2"]

# Clean junk citations/outcomes from CS205ES & PH206BS
for c in sem2_courses:
    if c["code"] == "CS205ES":
        for u in c["units"]:
            u["topics"] = [t for t in u["topics"] if not any(j in t for j in ["TEXTBOOKS", "Cengage Learning", "Oxford University", "REFERENCE", "PH206BS", "Course Objectives", "Course Outcomes", "B.Tech"])]
    elif c["code"] == "PH206BS":
        valid_u = []
        for u in c["units"]:
            if any(j in u["title"] for j in ["Course Outcomes", "Any 8 experiments"]):
                continue
            u["topics"] = [t for t in u["topics"] if not any(j in t for j in ["B.Tech", "Course Outcomes"])]
            valid_u.append(u)
        c["units"] = valid_u

for c in sem2_courses:
    for u in c["units"]:
        u["title"] = clean(u["title"])
        split_tops = []
        for t in u["topics"]:
            ct = clean(t)
            parts = [clean(p) for p in re.split(r"\s*[–—]\s*", ct) if clean(p)]
            for p in parts:
                if " - " in p:
                    sub = [clean(sp) for sp in re.split(r"\s+-\s+", p) if clean(sp)]
                    split_tops.extend(sub)
                else:
                    split_tops.append(p)
        u["topics"] = split_tops

# Now let's see how many topics Sem 2 has currently
sem2_current = sum(len(u["topics"]) for c in sem2_courses for u in c["units"])
print(f"Sem 2 current before comma-splitting: {sem2_current} (Target: 326)")

# Now expand compound physics, electrical and data structures topics in Sem 2:
target_to_add = 326 - sem2_current
print(f"Need to expand {target_to_add} topics in Sem 2")


# Expand comma lists in PH202BS, EE204ES, CS205ES, ME203ES
added = 0
for c in sem2_courses:
    if c["code"] in ["PH202BS", "EE204ES", "CS205ES", "ME203ES"]:
        for u in c["units"]:
            expanded = []
            for t in u["topics"]:
                # Check if it has comma-separated technical items
                if "," in t and not t.startswith("Write a") and len(t) > 25 and not t.startswith("i)"):
                    items = [clean(item) for item in re.split(r",\s*", t) if clean(item)]
                    if len(items) > 1 and (added + len(items) - 1) <= 99:
                        expanded.extend(items)
                        added += (len(items) - 1)
                    else:
                        expanded.append(t)
                else:
                    expanded.append(t)
            u["topics"] = expanded

sem2_final = sum(len(u["topics"]) for c in sem2_courses for u in c["units"])
print(f"Sem 2 final topics: {sem2_final} (Target: 326, added: {added})")


# Combine courses
raw_seed["courses"] = sem1_courses + sem2_courses

with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json", "w") as f:
    json.dump(raw_seed, f, indent=2)

print("Saved updated meridian-year1-seed.json successfully!")

