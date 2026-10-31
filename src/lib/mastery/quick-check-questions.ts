export interface QuickCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export function getQuickCheckQuestionsForTopic(
  topicTitle: string,
  courseCode?: string
): QuickCheckQuestion[] {
  const cleanTitle = topicTitle.toLowerCase();

  // Matrices / Linear Algebra
  if (cleanTitle.includes("echelon") || cleanTitle.includes("rank") || cleanTitle.includes("normal form")) {
    return [
      {
        id: "q1",
        question: "What is the rank of a matrix defined as in linear algebra?",
        options: [
          "The number of non-zero rows in its row-echelon form",
          "The total number of columns in the matrix",
          "The sum of all diagonal elements",
          "The determinant divided by the matrix order",
        ],
        correctIndex: 0,
        explanation:
          "The rank of a matrix equals the maximum number of linearly independent row or column vectors, which is directly given by the number of non-zero rows in its row-echelon form.",
      },
      {
        id: "q2",
        question: "In normal form [Ir 0; 0 0], what does 'r' represent?",
        options: [
          "The nullity of the transformation",
          "The rank of the matrix",
          "The number of elementary column operations performed",
          "The trace of the identity submatrix",
        ],
        correctIndex: 1,
        explanation:
          "In the canonical/normal form of a matrix, Ir is an identity matrix of order r, where r precisely denotes the rank of the original matrix.",
      },
      {
        id: "q3",
        question:
          "Which elementary row operation does NOT change the rank of a matrix?",
        options: [
          "Multiplying a row by zero",
          "Adding a scalar multiple of one row to another",
          "Replacing a row with random coefficients",
          "Squaring the elements of a row",
        ],
        correctIndex: 1,
        explanation:
          "Elementary row transformations (swapping rows, multiplying by a non-zero scalar, or adding a scalar multiple of one row to another) preserve linear independence and leave rank invariant.",
      },
    ];
  }

  // System of Linear Equations
  if (cleanTitle.includes("linear equations") || cleanTitle.includes("homogeneous")) {
    return [
      {
        id: "q1",
        question:
          "According to the Rouché–Capelli theorem, when does a non-homogeneous system AX = B have at least one solution?",
        options: [
          "When Rank(A) = Rank([A|B])",
          "When Rank(A) < Rank([A|B])",
          "When det(A) is strictly zero",
          "When the number of unknowns is greater than Rank([A|B])",
        ],
        correctIndex: 0,
        explanation:
          "A linear system AX = B is consistent if and only if the rank of the coefficient matrix A equals the rank of the augmented matrix [A|B].",
      },
      {
        id: "q2",
        question: "For a homogeneous system AX = 0 with n unknowns, non-trivial solutions exist if and only if:",
        options: [
          "Rank(A) = n",
          "Rank(A) < n",
          "det(A) > 0",
          "All eigenvalues are positive",
        ],
        correctIndex: 1,
        explanation:
          "A homogeneous system has non-trivial (non-zero) solutions if and only if the columns are linearly dependent, which occurs when Rank(A) < n.",
      },
      {
        id: "q3",
        question: "What is the trivial solution of any homogeneous linear system AX = 0?",
        options: [
          "X = [1, 1, ..., 1]^T",
          "X = [0, 0, ..., 0]^T",
          "X = undefined",
          "X = A^-1",
        ],
        correctIndex: 1,
        explanation:
          "The zero vector X = 0 is always a solution to any homogeneous system AX = 0, known as the trivial solution.",
      },
    ];
  }

  // Gauss-Seidel / Iteration
  if (cleanTitle.includes("seidel") || cleanTitle.includes("iteration") || cleanTitle.includes("jacobi")) {
    return [
      {
        id: "q1",
        question: "What is the sufficient condition for the Gauss-Seidel method to converge for any initial guess?",
        options: [
          "The coefficient matrix must be strictly diagonally dominant",
          "The matrix determinant must equal 1",
          "All matrix entries must be positive integers",
          "The matrix must be skew-symmetric",
        ],
        correctIndex: 0,
        explanation:
          "Strict diagonal dominance (|a_ii| > sum_{j!=i} |a_ij|) or symmetric positive definiteness guarantees the convergence of Gauss-Seidel iteration.",
      },
      {
        id: "q2",
        question: "How does Gauss-Seidel iteration differ from Jacobi iteration?",
        options: [
          "It uses newly computed values immediately in the current iteration",
          "It only computes one variable per run",
          "It does not require diagonal dominance",
          "It requires matrix inversion at each step",
        ],
        correctIndex: 0,
        explanation:
          "Gauss-Seidel incorporates updated values as soon as they become available within the same iteration step, accelerating convergence compared to Jacobi.",
      },
      {
        id: "q3",
        question: "When is an iterative method preferred over direct elimination like Gaussian elimination?",
        options: [
          "For large sparse systems where direct inversion causes fill-in",
          "Only for 2x2 systems",
          "When exact fractional arithmetic is required",
          "When the determinant is negative",
        ],
        correctIndex: 0,
        explanation:
          "Iterative methods preserve sparsity and require significantly less memory for large sparse matrices encountered in engineering problems.",
      },
    ];
  }

  // Programming / Data Structures / Algorithms
  if (cleanTitle.includes("pointer") || cleanTitle.includes("array") || cleanTitle.includes("memory") || cleanTitle.includes("c ") || cleanTitle.includes("variable")) {
    return [
      {
        id: "q1",
        question: `In core systems programming, what is the fundamental purpose of ${topicTitle}?`,
        options: [
          "Direct address calculation and efficient memory manipulation",
          "Automatic garbage collection without runtime overhead",
          "Compilation-time dead code elimination",
          "High-level graphic rendering pipeline",
        ],
        correctIndex: 0,
        explanation: `${topicTitle} provides explicit control over memory layout, alignment, and fast pointer arithmetic.`,
      },
      {
        id: "q2",
        question: "What is the typical time complexity of accessing an element by index in contiguous memory?",
        options: ["O(1) constant time", "O(log n) logarithmic time", "O(n) linear time", "O(n^2) quadratic time"],
        correctIndex: 0,
        explanation:
          "Contiguous array storage enables O(1) random access via the base address offset formula: base + index * sizeof(type).",
      },
      {
        id: "q3",
        question: "Which invariant must be maintained when allocating dynamic heap memory?",
        options: [
          "Every allocation must have a corresponding deallocation to prevent leaks",
          "Pointers must always point to the stack frame",
          "Variables must be declared static",
          "Heap pointers cannot be passed to functions",
        ],
        correctIndex: 0,
        explanation:
          "To avoid resource exhaustion and memory leaks, dynamically allocated memory must be explicitly freed or ownership transferred.",
      },
    ];
  }

  // Default collegiate conceptual questions for any syllabus topic
  return [
    {
      id: "q1",
      question: `What is the primary academic definition and scope of "${topicTitle}"?`,
      options: [
        `The foundational principles, analytical formulations, and methods governing ${topicTitle}`,
        "An obsolete empirical heuristic with no modern applications",
        "A purely administrative classification without theoretical grounding",
        "A software-specific shortcut not found in foundational literature",
      ],
      correctIndex: 0,
      explanation: `Mastering "${topicTitle}" requires understanding its formal definitions, operational conditions, and domain boundaries.`,
    },
    {
      id: "q2",
      question: `Under which conditions is the framework of "${topicTitle}" typically applied?`,
      options: [
        "When standard boundary conditions and domain constraints are verified",
        "Exclusively in stochastic non-deterministic environments",
        "Only when the system has zero variables",
        "Regardless of whether prerequisite hypotheses hold",
      ],
      correctIndex: 0,
      explanation:
        "Formal engineering methods depend on satisfying explicit hypothesis criteria and boundary conditions prior to application.",
    },
    {
      id: "q3",
      question: `Which validation procedure best confirms mastery of "${topicTitle}"?`,
      options: [
        "Deriving key results from first principles and solving rigorous problem sets",
        "Skimming lecture slides without attempting practice derivations",
        "Memorizing final numerical constants without conceptual derivation",
        "Assuming intuition replaces formal verification",
      ],
      correctIndex: 0,
      explanation:
        "University-grade mastery requires both theoretical derivation from first principles and verified calculation on test problems.",
    },
  ];
}
