import pypdf
import json
import re

pdf_path = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e/.user_uploaded/media_1793460058480_4bc4dd37.pdf"
reader = pypdf.PdfReader(pdf_path)

def clean_text(t):
    lines = t.split("\n")
    cleaned = []
    for l in lines:
        l = l.strip()
        if not l:
            continue
        if "R25 CSE Syllabus" in l or "JNTUH Hyderabad" in l or "JAWAHARLAL NEHRU" in l:
            continue
        cleaned.append(l)
    return "\n".join(cleaned)

courses_def = [
    # SEMESTER 1
    {
        "code": "MA101BS",
        "title": "Matrices and Calculus",
        "department": "Mathematics",
        "level": "100",
        "credits": 4,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "slate",
        "pages": [4, 5],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "CH102BS",
        "title": "Engineering Chemistry",
        "department": "Chemistry",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "teal",
        "pages": [6, 7],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "EN103HS",
        "title": "English for Skill Enhancement",
        "department": "Humanities",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "olive",
        "pages": [8, 9, 10],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "EC104ES",
        "title": "Electronic Devices and Circuits",
        "department": "Electronics",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "ochre",
        "pages": [11, 12],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "CS105ES",
        "title": "Programming for Problem Solving",
        "department": "Computer Science",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "plum",
        "pages": [13, 14],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "CH106BS",
        "title": "Engineering Chemistry Lab",
        "department": "Chemistry",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "teal",
        "pages": [15],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "CS107ES",
        "title": "Programming for Problem Solving Lab",
        "department": "Computer Science",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "plum",
        "pages": [16, 17],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "EN108HS",
        "title": "English Language and Communication Skills Lab",
        "department": "Humanities",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "olive",
        "pages": [18, 19, 20],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "ME109ES",
        "title": "Engineering Workshop",
        "department": "Mechanical",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "rust",
        "pages": [21],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },

    # SEMESTER 2
    {
        "code": "MA201BS",
        "title": "Ordinary Differential Equations and Vector Calculus",
        "department": "Mathematics",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "slate",
        "pages": [22, 23],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "PH202BS",
        "title": "Advanced Engineering Physics",
        "department": "Physics",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "graphite",
        "pages": [23, 24],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "ME203ES",
        "title": "Engineering Drawing and Computer Aided Drafting",
        "department": "Mechanical",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "rust",
        "pages": [25, 26],
        "defaultScheme": {"lessonCompletion": 20, "quizzes": 20, "assignments": 30, "midterm": 10, "finalExam": 20}
    },
    {
        "code": "EE204ES",
        "title": "Basic Electrical Engineering",
        "department": "Electrical",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "forest",
        "pages": [26, 27],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "CS205ES",
        "title": "Data Structures",
        "department": "Computer Science",
        "level": "100",
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "plum",
        "pages": [28, 29],
        "defaultScheme": {"lessonCompletion": 10, "quizzes": 25, "assignments": 30, "midterm": 15, "finalExam": 20}
    },
    {
        "code": "PH206BS",
        "title": "Advanced Engineering Physics Lab",
        "department": "Physics",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "graphite",
        "pages": [29, 30],
        "electiveExperimentsCount": 8,
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "CS207ES",
        "title": "Data Structures Lab",
        "department": "Computer Science",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "plum",
        "pages": [30, 31],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "CS208ES",
        "title": "Python Programming Lab",
        "department": "Computer Science",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "ochre",
        "pages": [31, 32, 33],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "EE209ES",
        "title": "Basic Electrical Engineering Lab",
        "department": "Electrical",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "forest",
        "pages": [33, 34, 35],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    },
    {
        "code": "CS210ES",
        "title": "IT Workshop",
        "department": "Computer Science",
        "level": "100",
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "slate",
        "pages": [35, 36],
        "defaultScheme": {"lessonCompletion": 60, "quizzes": 20, "assignments": 0, "midterm": 0, "finalExam": 20}
    }
]

parsed_courses = []

for c in courses_def:
    raw_text = clean_text("".join([reader.pages[p].extract_text() for p in c["pages"]]))
    
    # Extract Course Objectives & Outcomes / Description
    desc = ""
    desc_match = re.search(r"Course Description:\s*(.*?)(?=Course Objectives|Objectives|$)", raw_text, re.DOTALL)
    if desc_match:
        desc = desc_match.group(1).strip().replace("\n", " ")
    else:
        obj_match = re.search(r"Course Objectives:\s*(.*?)(?=Course Outcomes|Course outcomes|$)", raw_text, re.DOTALL)
        if obj_match:
            desc = "Course Objectives: " + " ".join([l.strip() for l in obj_match.group(1).strip().split("\n")[:4]])
        else:
            desc = f"Foundational curriculum in {c['title']} ({c['department']})."
    
    units = []
    
    if c["type"] == "theory":
        # Extract UNIT-I through UNIT-V
        unit_splits = re.split(r"(UNIT\s*[-–]\s*[IVX]+[:\s]*)", raw_text)
        if len(unit_splits) > 1:
            for idx in range(1, len(unit_splits), 2):
                header = unit_splits[idx].strip()
                content = unit_splits[idx+1]
                # End at TEXT BOOKS or next UNIT or similar
                end_match = re.search(r"(TEXT BOOKS|REFERENCES|Course Outcomes|REFERENCE BOOKS)", content)
                if end_match:
                    content = content[:end_match.start()]
                
                content_lines = [l.strip() for l in content.split("\n") if l.strip()]
                unit_title = content_lines[0] if content_lines else f"Unit {idx//2 + 1}"
                # Remove lecture hour counts (e.g. 8 L, 10 L)
                unit_title = re.sub(r"\s+\d+\s*L.*$", "", unit_title, flags=re.IGNORECASE).strip(": ")
                
                raw_topics = " ".join(content_lines[1:])
                # Split topics by semicolons, commas, or bullet dashes
                split_topics = [t.strip() for t in re.split(r";|\.\s+|:\s*", raw_topics) if len(t.strip()) > 3]
                if not split_topics:
                    split_topics = [f"Foundations of {unit_title}", f"Advanced concepts in {unit_title}"]
                
                units.append({
                    "unitNumber": len(units) + 1,
                    "title": unit_title if unit_title else f"Unit {len(units) + 1}",
                    "topics": split_topics
                })
        else:
            # Fallback units if regex didn't split
            units.append({
                "unitNumber": 1,
                "title": f"Core Foundations of {c['title']}",
                "topics": [f"Introduction to {c['title']}", "Fundamental Theorems and Methods", "Practical Applications"]
            })
    else:
        # LAB COURSE
        # Extract sections or experiments
        # Look for Roman numerals I., II., III. or Task 1, Experiment 1, Trade 1
        lines = [l.strip() for l in raw_text.split("\n") if l.strip()]
        exp_lines = []
        is_in_exp = False
        for line in lines:
            if any(k in line.upper() for k in ["LIST OF EXPERIMENTS", "PRACTICE SESSIONS", "EXERCISES", "TRADES FOR EXERCISES", "LIST OF TASKS"]):
                is_in_exp = True
                continue
            if is_in_exp and any(k in line.upper() for k in ["TEXT BOOKS", "REFERENCE BOOKS", "ONLINE RESOURCES"]):
                break
            if is_in_exp:
                exp_lines.append(line)
        
        # Group into sections/units
        current_unit = None
        for eline in exp_lines:
            # Check for section headers (e.g. Roman numerals I., II., or Section names, or Trades)
            sec_match = re.match(r"^([IVXLCDM]+\.|\d+\.|\bTrade\s+\d+|[A-Z][a-zA-Z\s]+:)\s*(.*)", eline)
            if sec_match and (len(eline) < 70 or ":" in eline):
                if current_unit and current_unit["topics"]:
                    units.append(current_unit)
                sec_title = eline.rstrip(":")
                current_unit = {
                    "unitNumber": len(units) + 1,
                    "title": sec_title,
                    "isSection": True,
                    "topics": []
                }
            elif current_unit:
                # Add as topic/experiment if meaningful
                clean_exp = eline.strip(" -•*")
                if len(clean_exp) > 5 and not clean_exp.isupper():
                    current_unit["topics"].append(clean_exp)
            else:
                current_unit = {
                    "unitNumber": 1,
                    "title": "Laboratory Experiments",
                    "isSection": True,
                    "topics": [eline]
                }
        if current_unit and current_unit["topics"]:
            units.append(current_unit)
        
        if not units:
            units = [{
                "unitNumber": 1,
                "title": "Practical Lab Exercises",
                "isSection": True,
                "topics": ["Laboratory Setup and Safety Orientation", "Core Experiments", "Final Verification and Viva"]
            }]

    parsed_courses.append({
        "code": c["code"],
        "title": c["title"],
        "department": c.get("dept") or c.get("department", "Computer Science"),
        "level": c["level"],
        "credits": c["credits"],
        "termId": c["termId"],
        "type": c["type"],
        "colorTag": c["colorTag"],
        "description": desc,
        "gradingScheme": c["defaultScheme"],
        "electiveExperimentsCount": c.get("electiveExperimentsCount"),
        "units": units
    })

seed_payload = {
    "institution": "JNTUH Hyderabad (R-25 Regulations)",
    "portal": "Valeria’s Creds",
    "academicYear": "AY 2025-2026",
    "terms": [
        {
            "id": "term-sem-1",
            "name": "Semester 1 (AY 2025-2026)",
            "startDate": "2025-08-01",
            "endDate": "2025-12-15",
            "isCurrent": True
        },
        {
            "id": "term-sem-2",
            "name": "Semester 2 (AY 2025-2026)",
            "startDate": "2026-01-05",
            "endDate": "2026-05-20",
            "isCurrent": False
        }
    ],
    "courses": parsed_courses
}

out_file = "/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json"
with open(out_file, "w") as f:
    json.dump(seed_payload, f, indent=2)

print(f"Successfully generated seed data with {len(parsed_courses)} courses to {out_file}")

# Calculate credits
sem1_courses = [c for c in parsed_courses if c["termId"] == "term-sem-1"]
sem2_courses = [c for c in parsed_courses if c["termId"] == "term-sem-2"]
print(f"Sem 1: {len(sem1_courses)} courses, {sum(c['credits'] for c in sem1_courses)} credits")
print(f"Sem 2: {len(sem2_courses)} courses, {sum(c['credits'] for c in sem2_courses)} credits")
