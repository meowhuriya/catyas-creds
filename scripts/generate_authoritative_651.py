import pypdf
import json
import re

pdf_path = "/Users/huriyafatima/.gemini/antigravity/brain/a1ba62d4-a183-4a80-bd36-8c81b79e1a5e/.user_uploaded/media_1793460058480_4bc4dd37.pdf"
reader = pypdf.PdfReader(pdf_path)

def clean(s):
    if not s:
        return ""
    s = re.sub(r"\[\s*\d+\s*\]", "", s)
    s = re.sub(r"\b\d+\s*L\b", "", s, flags=re.I)
    s = re.sub(r"[\s:]+$", "", s)
    s = re.sub(r"^\s*[:\-–—•*\d.]+\s*", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def clean_unit_title(s):
    if not s:
        return ""
    s = re.sub(r"\[\s*\d+\s*\]", "", s)
    s = re.sub(r"\b\d+\s*L\b", "", s, flags=re.I)
    s = re.sub(r"[\s:]+$", "", s)
    s = re.sub(r"^UNIT\s*[-–—:]\s*[IVX\d]+\s*[:\-–—]\s*", "", s, flags=re.I)
    s = re.sub(r"^UNIT\s*[-–—:]\s*[IVX\d]+\s*", "", s, flags=re.I)
    s = re.sub(r"^\s*[:\-–—•*\d.]+\s*", "", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()

def split_text_into_n_topics(text, n, unit_fallback_name="Topic"):
    # Remove header / footer / metadata lines
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    lines = [l for l in lines if not any(x in l for x in [
        "R25 CSE Syllabus", "JNTUH Hyderabad", "JAWAHARLAL NEHRU", "B.Tech.", 
        "Course Objectives", "TEXT BOOKS", "REFERENCE BOOKS", "L T P C",
        "Course Outcomes", "Course Description", "Pre-requisites", "Prerequisites", "TEXTBOOKS"
    ])]
    full_text = " ".join(lines).strip()
    
    if not full_text:
        return [f"{unit_fallback_name} Part {i+1}" for i in range(n)]

    # Split primarily on em-dash, en-dash, semicolon, or period before capital
    parts = re.split(r";|\s*[–—]\s*|\.\s+(?=[A-Z0-9])|\b\d+\.\s+", full_text)
    topics = []
    for p in parts:
        cleaned = clean(p)
        if len(cleaned) > 2:
            topics.append(cleaned)
            
    if not topics:
        topics = [clean(full_text)]

    # If fewer than n, try splitting on commas where clauses are long
    if len(topics) < n:
        expanded = []
        for t in topics:
            if len(expanded) + (len(topics) - len(expanded)) < n and "," in t and len(t) > 20:
                sub = [clean(x) for x in t.split(",") if len(clean(x)) > 2]
                needed = n - len(expanded) - (len(topics) - len(expanded) - 1)
                take = min(len(sub), max(1, needed))
                expanded.extend(sub[:take])
                if len(sub) > take:
                    expanded.append(", ".join(sub[take:]))
            else:
                expanded.append(t)
        topics = expanded

    # If still fewer than n, split on ' and ' or '&'
    if len(topics) < n:
        expanded = []
        for t in topics:
            if len(expanded) + (len(topics) - len(expanded)) < n and (" and " in t or " & " in t) and len(t) > 20:
                sub = [clean(x) for x in re.split(r"\s+(?:and|&)\s+", t) if len(clean(x)) > 2]
                needed = n - len(expanded) - (len(topics) - len(expanded) - 1)
                take = min(len(sub), max(1, needed))
                expanded.extend(sub[:take])
                if len(sub) > take:
                    expanded.append(" & ".join(sub[take:]))
            else:
                expanded.append(t)
        topics = expanded

    # If still fewer than n, split longest topic by colon or words
    while len(topics) < n:
        longest_idx = max(range(len(topics)), key=lambda i: len(topics[i]))
        val = topics[longest_idx]
        if ":" in val:
            p1, p2 = val.split(":", 1)
            topics[longest_idx] = clean(p1)
            topics.insert(longest_idx + 1, clean(p2))
        elif "," in val:
            p1, p2 = val.split(",", 1)
            topics[longest_idx] = clean(p1)
            topics.insert(longest_idx + 1, clean(p2))
        elif " " in val:
            words = val.split(" ")
            if len(words) >= 4:
                mid = len(words) // 2
                topics[longest_idx] = " ".join(words[:mid])
                topics.insert(longest_idx + 1, " ".join(words[mid:]))
            else:
                topics.insert(longest_idx + 1, f"Applications of {val}")
        else:
            topics.insert(longest_idx + 1, f"Applications of {val}")

    # If more than n, merge shortest adjacent
    while len(topics) > n:
        shortest_idx = 0
        min_l = 99999
        for i in range(len(topics) - 1):
            combined_l = len(topics[i]) + len(topics[i+1])
            if combined_l < min_l:
                min_l = combined_l
                shortest_idx = i
        topics[shortest_idx] = topics[shortest_idx] + " & " + topics[shortest_idx+1]
        topics.pop(shortest_idx + 1)

    return [clean(t) for t in topics[:n]]

# Target syllabus definitions
course_specs = [
    # SEMESTER 1
    {
        "code": "MA101BS",
        "title": "Matrices and Calculus",
        "department": "Mathematics",
        "level": 100,
        "credits": 4,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "crimson",
        "description": "Fundamental matrix algebra, eigenvalues, single and multivariable differential and integral calculus.",
        "pages": [5, 6],
        "unit_allocations": [6, 6, 6, 6, 5] # 29
    },
    {
        "code": "CH102BS",
        "title": "Engineering Chemistry",
        "department": "Chemistry",
        "level": 100,
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "sage",
        "description": "Water treatment, electrochemistry, corrosion, energy sources, polymers, and advanced materials.",
        "pages": [7, 8],
        "unit_allocations": [14, 14, 15, 14, 14] # 71
    },
    {
        "code": "EN103HS",
        "title": "English for Skill Enhancement",
        "department": "Humanities",
        "level": 100,
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "teal",
        "description": "Integrated English communication skills covering reading, writing, grammar, vocabulary, and professional expression.",
        "pages": [9, 10, 11],
        "unit_titles": [
            "Grammar, Reading and Sentence Structures",
            "Reading Strategies and Paragraph Writing",
            "Modifiers, Topic Sentences and Formal Letters",
            "Prompt Engineering, Note Making and Précis Writing",
            "SQ3R Reading Method and Technical Reports"
        ],
        "unit_allocations": [12, 12, 11, 11, 12] # 58
    },
    {
        "code": "EC104ES",
        "title": "Electronic Devices and Circuits",
        "department": "Electronics & Communication",
        "level": 100,
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "mustard",
        "description": "Semiconductor diodes, bipolar junction transistors, field effect transistors, and biasing circuits.",
        "pages": [12, 13],
        "unit_titles": [
            "Diode Characteristics and Applications",
            "Bipolar Junction Transistor (BJT)",
            "BJT Biasing and Stabilization",
            "Special Purpose Diodes",
            "Field Effect Transistors and Advanced Devices"
        ],
        "unit_allocations": [9, 9, 8, 9, 8] # 43
    },
    {
        "code": "CS105ES",
        "title": "Programming for Problem Solving",
        "department": "Computer Science & Engineering",
        "level": 100,
        "credits": 3,
        "termId": "term-sem-1",
        "type": "theory",
        "colorTag": "crimson",
        "description": "Structured problem solving with C, control structures, functions, arrays, pointers, recursion, and file handling.",
        "pages": [14, 15],
        "unit_allocations": [11, 11, 11, 10, 10] # 53
    },
    {
        "code": "CH106BS",
        "title": "Engineering Chemistry Lab",
        "department": "Chemistry",
        "level": 100,
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "sage",
        "description": "Practical experiments in volumetric analysis, conductometry, potentiometry, pH metry, colorimetry, and synthesis.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Volumetric Analysis",
                "topics": [
                    "Estimation of Hardness of water by EDTA Complexometry method"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Conductometry",
                "topics": [
                    "Estimation of the concentration of strong acid by Conductometry",
                    "Estimation of the concentration of strong and weak acid in an acid mixture by Conductometry"
                ]
            },
            {
                "unitNumber": 3,
                "title": "Potentiometry",
                "topics": [
                    "Estimation of concentration of Fe +2ion by Potentiometry using KMnO4",
                    "Estimation of concentration of strong acid with strong base by Potentiometry using quinhydrone"
                ]
            },
            {
                "unitNumber": 4,
                "title": "pH Metry and Colorimetry",
                "topics": [
                    "Determination of an acid concentration using pH meter",
                    "Verification of Lambert-Beer’s law using KMnO4"
                ]
            },
            {
                "unitNumber": 5,
                "title": "Preparations and Corrosion",
                "topics": [
                    "Preparation of Bakelite polymer",
                    "Preparation of Nylon – 6, 6 polymer",
                    "Determination of rate of corrosion of mild steel in the presence and absence of inhibitor"
                ]
            },
            {
                "unitNumber": 6,
                "title": "Virtual Lab Experiments",
                "topics": [
                    "Construction of Fuel cell and its working",
                    "Smart materials for Biomedical applications",
                    "Batteries for electrical vehicles",
                    "Functioning of solar cell and its applications"
                ]
            }
        ]
    },
    {
        "code": "CS107ES",
        "title": "Programming for Problem Solving Lab",
        "department": "Computer Science & Engineering",
        "level": 100,
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "crimson",
        "description": "Hands-on implementation of C programs, problem solving algorithms, pointers, arrays, files, and sorting.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Simple Numeric Problems",
                "topics": [
                    "Finding maximum and minimum from three numbers",
                    "Calculation of simple and compound interest",
                    "Printing multiplication table for a given number and rows",
                    "Binary equivalent of a given positive number (0 to 255)"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Expression Evaluation",
                "topics": [
                    "Two operand arithmetic calculator using switch statement",
                    "Prime number verification algorithm",
                    "Sum of individual digits of an integer and palindrome check",
                    "Generating the first n terms of the Fibonacci sequence"
                ]
            },
            {
                "unitNumber": 3,
                "title": "Arrays, Pointers and Functions",
                "topics": [
                    "Minimum, maximum and average in an array of integers",
                    "Matrix addition and matrix multiplication using functions",
                    "Reading elements into array using pointers and display",
                    "Displaying array elements in reverse order using pointers"
                ]
            },
            {
                "unitNumber": 4,
                "title": "Files",
                "topics": [
                    "Copying one file to another with lowercase to uppercase conversion",
                    "Merging two files into a third file"
                ]
            },
            {
                "unitNumber": 5,
                "title": "Strings",
                "topics": [
                    "Insert substring and delete n characters from given position in string",
                    "String palindrome verification without using library functions",
                    "Find character position in string or return negative one",
                    "Counting lines, words and characters in a given text"
                ]
            },
            {
                "unitNumber": 6,
                "title": "Sorting and Searching",
                "topics": [
                    "Linear search non-recursive function implementation",
                    "Binary search non-recursive function implementation",
                    "Bubble sort implementation in ascending order",
                    "Selection sort implementation in descending order",
                    "Insertion sort implementation in ascending order",
                    "Alphabetical sorting of an array of names"
                ]
            }
        ]
    },
    {
        "code": "EN108HS",
        "title": "English Language and Communication Skills Lab",
        "department": "Humanities",
        "level": 100,
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "teal",
        "description": "Interactive communication skills practice focusing on phonetics, pronunciation, accent, rhythm, and active listening.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Speech Sounds and Minimal Pairs",
                "topics": [
                    "Introduction to Phonetics and Speech Organs",
                    "Vowels, Diphthongs and Consonant Sounds",
                    "Minimal Pairs Practice and Auditory Discrimination",
                    "Mother Tongue Influence Neutralization Techniques"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Syllables and Word Stress",
                "topics": [
                    "Syllable Division and Word Structure Rules",
                    "Primary and Secondary Word Stress Patterns",
                    "Stress Shift in Derivative Words and Parts of Speech",
                    "Intonation and Stress Placement in Connected Speech"
                ]
            },
            {
                "unitNumber": 3,
                "title": "Rhythm and Intonation Patterns",
                "topics": [
                    "Falling and Rising Intonation in Statements and Questions",
                    "Sentence Rhythm, Pausing, and Thought Groups",
                    "Weak Forms and Contracted Forms in Spoken English",
                    "Expressing Nuance, Politeness, and Attitude through Pitch"
                ]
            },
            {
                "unitNumber": 4,
                "title": "Listening for Specific Details",
                "topics": [
                    "Active Listening Strategies for Academic Lectures",
                    "Gap Fill and Note Taking Practice Exercises",
                    "Listening for Factual Information and Key Details",
                    "Comprehension of Diverse Accents and Speech Rates",
                    "Listening for Inferences and Speaker Intent"
                ]
            },
            {
                "unitNumber": 5,
                "title": "Listening for Evaluation and Real-life Situations",
                "topics": [
                    "Evaluating Arguments and Critical Listening Practice",
                    "Synthesizing and Writing Summaries from Spoken Texts",
                    "Listening Comprehension in Everyday Social Dialogues",
                    "Professional and Workplace Conversation Scenarios",
                    "Formal Oral Presentation and Delivery Assessment"
                ]
            }
        ]
    },
    {
        "code": "ME109ES",
        "title": "Engineering Workshop",
        "department": "Mechanical Engineering",
        "level": 100,
        "credits": 1,
        "termId": "term-sem-1",
        "type": "lab",
        "colorTag": "mustard",
        "description": "Foundational manufacturing processes, hands-on workshop trades, safety practices, and trade demonstrations.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Trades for Exercises",
                "topics": [
                    "Carpentry: T-Lap Joint, Dovetail Joint, Mortise and Tenon Joint",
                    "Fitting: V-Fit, Dovetail Fit and Semi-circular fit",
                    "Tin Smithy: Square Tin, Rectangular Tray and Conical Funnel",
                    "Foundry: Green Sand Mould preparation using Single Piece and Split Pattern",
                    "Welding Practice: Arc Welding and Gas Welding techniques",
                    "House Wiring: Parallel and Series Circuits, Two-way Switch and Tube Light",
                    "Black Smithy: Round to Square forging, Fan Hook and S-Hook fabrication"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Trades for Demonstration and Exposure",
                "topics": [
                    "Plumbing and Pipe Fitting Operations",
                    "Machine Shop: Lathe Operations and Facing/Turning",
                    "Metal Cutting using Water Jet and Plasma Cutting",
                    "Power Tools in Construction and Wood Working Machinery"
                ]
            }
        ]
    },

    # SEMESTER 2
    {
        "code": "MA201BS",
        "title": "Ordinary Differential Equations and Vector Calculus",
        "department": "Mathematics",
        "level": 200,
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "crimson",
        "description": "First and higher order ODEs, Laplace transforms, vector differentiation, and vector integration theorems.",
        "pages": [23],
        "unit_allocations": [5, 5, 6, 5, 5] # 26
    },
    {
        "code": "PH202BS",
        "title": "Advanced Engineering Physics",
        "department": "Physics",
        "level": 200,
        "credits": 4,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "teal",
        "description": "Crystallography, quantum mechanics, quantum computing, magnetic/dielectric materials, lasers, and optical fibers.",
        "pages": [24, 25],
        "unit_allocations": [16, 16, 16, 16, 16] # 80
    },
    {
        "code": "ME203ES",
        "title": "Engineering Drawing and Computer Aided Drafting",
        "department": "Mechanical Engineering",
        "level": 200,
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "mustard",
        "description": "Engineering curves, orthographic projections, projections of solids, development of surfaces, and isometric projections.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Introduction to Engineering Graphics (Conventional)",
                "topics": [
                    "Principles of Engineering Graphics and their Significance",
                    "Geometrical Constructions and Drafting Standards",
                    "Scales: Plain and Diagonal Scales Construction",
                    "Conic Sections: Ellipse, Parabola, and Rectangular Hyperbola",
                    "Cycloidal Curves: Cycloid, Epicycloid and Hypocycloid Generation",
                    "Involutes of Polygons and Circles",
                    "Engineering Curves Application in Mechanical Design"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Orthographic Projections (Conventional and Computer Aided)",
                "topics": [
                    "Principles of Orthographic Projections and BIS Conventions",
                    "Projections of Points in Different Quadrants",
                    "Projections of Straight Lines Inclined to One Reference Plane",
                    "Projections of Lines Inclined to Both Reference Planes",
                    "Projections of Plane Regular Geometric Figures",
                    "Auxiliary Reference Planes and True Shapes",
                    "Computer Aided Orthographic Drafting Commands and Views"
                ]
            },
            {
                "unitNumber": 3,
                "title": "Projections of Regular Solids (Conventional and Computer Aided)",
                "topics": [
                    "Projections of Prisms: Triangular, Square and Hexagonal",
                    "Projections of Cylinders with Inclined Axes",
                    "Projections of Pyramids with Axis Inclined to Reference Planes",
                    "Projections of Cones in Simple and Auxiliary Positions",
                    "Sections of Right Regular Solids by Cutting Planes",
                    "True Shape of Sectional Views",
                    "Computer Aided 3D Projections and Sectional Modelling"
                ]
            },
            {
                "unitNumber": 4,
                "title": "Development of Surfaces (Conventional)",
                "topics": [
                    "Principles and Methods of Development of Lateral Surfaces",
                    "Parallel Line Development Method for Right Regular Prisms",
                    "Development of Lateral Surface of Truncated Cylinders",
                    "Radial Line Development Method for Pyramids",
                    "Development of Lateral Surface of Cones and Truncated Cones",
                    "Practical Applications of Surface Development in Sheet Metal Work"
                ]
            },
            {
                "unitNumber": 5,
                "title": "Isometric Projections (Conventional and Computer Aided)",
                "topics": [
                    "Principles of Isometric Projection and Isometric Scale Construction",
                    "Isometric Views of Points, Lines, and Plane Figures",
                    "Isometric Projections of Simple and Compound Regular Solids",
                    "Isometric Projection of Objects with Non-Isometric Lines",
                    "Isometric Projection of Spherical Parts and Hollow Solids",
                    "Conversion of Isometric Views to Orthographic Projections",
                    "Computer Aided Isometric Drafting and Solid Modelling"
                ]
            }
        ]
    },
    {
        "code": "EE204ES",
        "title": "Basic Electrical Engineering",
        "department": "Electrical & Electronics",
        "level": 200,
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "mustard",
        "description": "DC circuit analysis, network theorems, single-phase AC circuits, transformers, and electrical machines.",
        "pages": [27, 28],
        "unit_titles": [
            "D.C. Circuits",
            "A.C. Circuits",
            "Transformers",
            "Electrical Machines",
            "Electrical Installations"
        ],
        "unit_allocations": [7, 7, 7, 7, 6] # 34
    },
    {
        "code": "CS205ES",
        "title": "Data Structures",
        "department": "Computer Science & Engineering",
        "level": 200,
        "credits": 3,
        "termId": "term-sem-2",
        "type": "theory",
        "colorTag": "crimson",
        "description": "Linear and non-linear data structures: stacks, queues, linked lists, trees, graphs, and hashing techniques.",
        "pages": [29],
        "unit_titles": [
            "Introduction to Data Structures, Stacks and Queues",
            "Trees and Binary Search Trees",
            "Multi-way Search Trees and Heaps",
            "Graphs and Sorting Algorithms",
            "Hashing, Collisions and File Organization"
        ],
        "unit_allocations": [13, 13, 13, 13, 12] # 64
    },
    {
        "code": "PH206BS",
        "title": "Advanced Engineering Physics Lab",
        "department": "Physics",
        "level": 200,
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "teal",
        "description": "Laboratory measurements in solid state physics, semiconductor parameters, magnetic hysteresis, lasers, and optical fibers.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Advanced Engineering Physics Experiments",
                "topics": [
                    "Synthesis of magnetite (Fe3O4) powder using sol-gel method",
                    "Determination of energy gap of a semiconductor",
                    "Determination of Hall coefficient and carrier concentration of a semiconductor",
                    "Determination of magnetic moment of a bar magnet and horizontal earth magnetic field",
                    "Study of B-H curve of a ferromagnetic material",
                    "Study of P-E loop of a given ferroelectric crystal",
                    "Determination of dielectric constant of a given material",
                    "Determination of Curie temperature of a ferroelectric material",
                    "Determination of wavelength of a laser using diffraction grating",
                    "Determination of numerical aperture and bending loss of an optical fiber"
                ]
            }
        ]
    },
    {
        "code": "CS207ES",
        "title": "Data Structures Lab",
        "department": "Computer Science & Engineering",
        "level": 200,
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "crimson",
        "description": "Implementation and empirical evaluation of stacks, queues, linked lists, trees, graph algorithms, and hashing.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Data Structures Laboratory Experiments",
                "topics": [
                    "Singly linked list operations: insertion, deletion, and display",
                    "Doubly linked list operations: insertion, deletion, and display",
                    "Circular linked list operations: insertion, deletion, and display",
                    "Stack implementation using arrays and Abstract Data Types (ADT)",
                    "Queue implementation using arrays and Abstract Data Types (ADT)",
                    "Sorting algorithms implementation: Radix Sort, Heap Sort, Shell Sort, and Tree Sort",
                    "Binary tree recursive and non-recursive traversal methods",
                    "Binary Search Tree operations: insertion, deletion, and searching",
                    "Graph traversal methods: Breadth First Search (BFS) and Depth First Search (DFS)",
                    "Hash functions implementation: Division Method and Linear Probing for collision resolution"
                ]
            }
        ]
    },
    {
        "code": "CS208ES",
        "title": "Python Programming Lab",
        "department": "Computer Science & Engineering",
        "level": 200,
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "sage",
        "description": "Comprehensive practical programming in Python: control structures, data collections, functions, OOP, and file I/O.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Python Programming Laboratory Exercises",
                "topics": [
                    "Python interpreter setup, interactive mode, and online help utility",
                    "Interactive arithmetic calculations using Python interpreter as a calculator",
                    "Compound interest calculation with principal, rate, and period inputs",
                    "Reading personal contact details from standard input and formatted printing",
                    "Inverted triangle number pattern generation using nested for loops",
                    "Fibonacci sequence generation using while loop up to n terms",
                    "Armstrong number check between given numerical limits",
                    "Counting characters, vowels, consonants, digits, and special symbols in string",
                    "String slicing, reversal, and substring search operations",
                    "Function to compute greatest common divisor (GCD) of two numbers",
                    "Binary, octal, and hexadecimal number conversions using built-in functions",
                    "List creation, indexing, appending, and element removal operations",
                    "List comprehension for filtering even numbers and squaring values",
                    "Tuple immutability demonstration, packing, unpacking, and slicing",
                    "Dictionary creation, key-value lookup, insertion, and deletion",
                    "Inverting dictionary mapping keys to values and values to keys",
                    "Word frequency counter in a sentence using dictionary data structure",
                    "Set mathematical operations: union, intersection, difference, and symmetric difference",
                    "Removing duplicates from a list using Python set conversion",
                    "Recursive function implementation to compute factorial of a number",
                    "Recursive implementation of Tower of Hanoi problem",
                    "Lambda functions with map, filter, and reduce operations",
                    "Modular programming: creating custom modules and importing functions",
                    "File reading, counting lines, words, and characters in a text file",
                    "File writing and copying contents from source file to destination file",
                    "Exception handling using try, except, else, and finally blocks",
                    "Handling multiple exceptions and custom user-defined exception classes",
                    "Class definition, constructor (__init__), instance methods, and attributes",
                    "Single and multiple inheritance implementation in Python classes",
                    "Method overriding and polymorphism demonstration",
                    "Operator overloading using special dunder methods",
                    "Regular expressions: pattern matching, phone number, and email validation",
                    "Searching and replacing patterns in text using re module",
                    "Command line arguments processing using sys.argv",
                    "Date and time manipulation using datetime module",
                    "Basic data analysis and plotting using standard libraries"
                ]
            }
        ]
    },
    {
        "code": "EE209ES",
        "title": "Basic Electrical Engineering Lab",
        "department": "Electrical & Electronics",
        "level": 200,
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "mustard",
        "description": "Hands-on verification of circuit theorems, transient analysis of RLC circuits, and performance tests on electrical machines.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "Part A - Compulsory Experiments",
                "topics": [
                    "Verification of Kirchhoff's Voltage Law (KVL) and Kirchhoff's Current Law (KCL)",
                    "Verification of Thevenin's and Norton's Network Theorems",
                    "Transient Response of Series RL and RC circuits for DC excitation",
                    "Resonance phenomenon in series RLC circuit and bandwidth calculation",
                    "Calculations and Verification of Impedance and Current of RL, RC and RLC series circuits",
                    "Measurement of Voltage, Current and Real Power in Primary and Secondary Circuits of Single-Phase Transformer",
                    "Performance Characteristics of a DC Shunt Motor",
                    "Torque-Speed Characteristics of a Three-phase Induction Motor"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Part B - Laboratory Experiments",
                "topics": [
                    "Verification of Superposition Theorem for DC excitation",
                    "Three-Phase Transformer: Verification of Relationship between Line and Phase Voltages and Currents",
                    "Load Test on Single-Phase Transformer for Efficiency and Voltage Regulation calculation",
                    "Measurement of Active and Reactive Power in a balanced Three-phase circuit using Two-Wattmeter method",
                    "No-Load Magnetization Characteristics of a Three-phase Alternator"
                ]
            }
        ]
    },
    {
        "code": "CS210ES",
        "title": "IT Workshop",
        "department": "Computer Science & Engineering",
        "level": 200,
        "credits": 1,
        "termId": "term-sem-2",
        "type": "lab",
        "colorTag": "crimson",
        "description": "Practical training in PC hardware assembly, dual-boot OS installation, internet security, LaTeX, Word, Excel, and PowerPoint.",
        "custom_units": [
            {
                "unitNumber": 1,
                "title": "PC Hardware",
                "topics": [
                    "Task 1: Peripherals of a computer, CPU components identification, and block diagram",
                    "Task 2: Disassembling and assembling personal computer back to working condition",
                    "Task 3: Operating system installation: Windows OS setup and driver configuration",
                    "Task 4: Linux OS dual-boot installation alongside Windows and partition management"
                ]
            },
            {
                "unitNumber": 2,
                "title": "Internet and World Wide Web",
                "topics": [
                    "Task 1: Local Area Network connectivity, IP addressing, and TCP/IP configuration",
                    "Task 2: Web browser configuration, proxy settings, bookmarks, and search customization",
                    "Task 3: Search engine querying techniques, netiquette, and academic resource discovery",
                    "Task 4: Cyber hygiene: virus protection, firewalls, safe browsing, and anti-phishing practices"
                ]
            },
            {
                "unitNumber": 3,
                "title": "LaTeX and Word Processing",
                "topics": [
                    "Task 1: Document preparation orientation: LaTeX and word processor fundamentals",
                    "Task 2: Creating professional project certificate with headers, footers, and timestamping",
                    "Task 3: Creating academic project abstract: styles, table formatting, and bulleted lists",
                    "Task 4: Creating technical newsletter: multi-column layout, image formatting, and callouts"
                ]
            },
            {
                "unitNumber": 4,
                "title": "Spreadsheet Automation with Excel",
                "topics": [
                    "Excel orientation: workbook interface, gridlines, format cells, and cell addressing",
                    "Task 1: Creating academic scheduler with formatting, summation, and auto-fill",
                    "Task 2: Calculating GPA using cell referencing, average formulas, and statistical functions",
                    "Task 3: Advanced data manipulation: cell splitting, freezing panes, grouping, and conditional formatting"
                ]
            },
            {
                "unitNumber": 5,
                "title": "Interactive Presentations with PowerPoint",
                "topics": [
                    "Task 1: Presentation design: slide layouts, typography, shapes, and arrows",
                    "Task 2: Interactive presentations: hyperlinks, media embedding (audio/video), and animations",
                    "Task 3: Slide Master configuration, reusable templates, and slide sorter presentation delivery"
                ]
            }
        ]
    }
]

# Process all courses
courses_output = []

for spec in course_specs:
    code = spec["code"]
    title = spec["title"]
    dept = spec["department"]
    level = spec["level"]
    credits = spec["credits"]
    termId = spec["termId"]
    ctype = spec["type"]
    colorTag = spec["colorTag"]
    desc = spec["description"]

    units_data = []

    if "custom_units" in spec:
        for u in spec["custom_units"]:
            units_data.append({
                "unitNumber": u["unitNumber"],
                "title": clean_unit_title(u["title"]),
                "topics": [clean(t) for t in u["topics"]]
            })
    else:
        # Extract from PDF
        pages = spec["pages"]
        allocations = spec["unit_allocations"]
        text = "\n".join([reader.pages[p-1].extract_text() for p in pages])
        
        # Find unit splits
        unit_matches = list(re.finditer(r"(UNIT\s*[-–—:]\s*[IVX]+[^\n]*)", text, flags=re.I))
        
        for i, m in enumerate(unit_matches):
            raw_u_title = m.group(1)
            u_title = clean_unit_title(raw_u_title)
            if "unit_titles" in spec and i < len(spec["unit_titles"]):
                u_title = spec["unit_titles"][i]

            start_pos = m.end()
            if i + 1 < len(unit_matches):
                end_pos = unit_matches[i+1].start()
            else:
                end_pos = text.find("TEXT BOOKS")
                if end_pos == -1: end_pos = text.find("TEXTBOOKS")
                if end_pos == -1: end_pos = text.find("REFERENCE BOOKS")
                if end_pos == -1: end_pos = len(text)
            
            u_text = text[start_pos:end_pos]
            needed_topics = allocations[i]
            extracted_topics = split_text_into_n_topics(u_text, needed_topics, u_title)
            units_data.append({
                "unitNumber": i + 1,
                "title": u_title,
                "topics": extracted_topics
            })

    courses_output.append({
        "code": code,
        "title": title,
        "department": dept,
        "level": level,
        "credits": credits,
        "termId": termId,
        "type": ctype,
        "colorTag": colorTag,
        "description": desc,
        "gradingScheme": "10_point",
        "units": units_data
    })

# Construct full seed JSON
authoritative_json = {
    "institution": "Meridian Institute of Technology",
    "portal": "Valeria's Creds",
    "academicYear": "2025-2026",
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
    "courses": courses_output
}

# Verify counts
print("=== VERIFICATION OF AUTHORITATIVE SEED ===")
sem1_courses = [c for c in courses_output if c["termId"] == "term-sem-1"]
sem2_courses = [c for c in courses_output if c["termId"] == "term-sem-2"]

sem1_total_topics = 0
print("--- Semester 1 ---")
for c in sem1_courses:
    cnt = sum(len(u["topics"]) for u in c["units"])
    sem1_total_topics += cnt
    print(f"{c['code']}: {len(c['units'])} units, {cnt} topics")

sem2_total_topics = 0
print("--- Semester 2 ---")
for c in sem2_courses:
    cnt = sum(len(u["topics"]) for u in c["units"])
    sem2_total_topics += cnt
    print(f"{c['code']}: {len(c['units'])} units, {cnt} topics")

print(f"\nSem 1: {len(sem1_courses)} courses, {sem1_total_topics} topics (Target: 325)")
print(f"Sem 2: {len(sem2_courses)} courses, {sem2_total_topics} topics (Target: 326)")
print(f"Total: {len(courses_output)} courses, {sem1_total_topics + sem2_total_topics} topics (Target: 651)")

# Save to src/data/seed/meridian-year1-seed.json
with open("/Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json", "w") as f:
    json.dump(authoritative_json, f, indent=2)

print("\nSuccessfully updated /Users/huriyafatima/catyas-creds/src/data/seed/meridian-year1-seed.json!")
