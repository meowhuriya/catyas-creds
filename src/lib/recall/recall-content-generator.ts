import { RecallStyle } from "@/types/schemas";

export interface PracticeProblem {
  id: string;
  problemNumber: number;
  statement: string;
  hint?: string;
  solution: string;
}

export interface CodePracticeItem {
  prompt: string;
  starterSignature: string;
  taskGoal: string;
  referenceCode: string;
  keyInvariants: string[];
}

export interface QuestionPracticeItem {
  questionNumber: number;
  question: string;
  promptGoal: string;
  modelAnswer: string;
}

export interface VocabularyPracticeItem {
  term: string;
  contextPrompt: string;
  modelDefinition: string;
  exemplarSentence: string;
}

export interface RecallPracticeContent {
  style: RecallStyle;
  topicTitle: string;
  courseCode: string;
  courseTitle: string;
  problems?: PracticeProblem[];
  code?: CodePracticeItem;
  questions?: QuestionPracticeItem[];
  vocabulary?: VocabularyPracticeItem[];
}

/**
 * Deterministically generates active recall practice exercises tailored to the topic title,
 * course domain, and specific recall style.
 */
export function generateRecallContent(options: {
  topicTitle: string;
  courseCode?: string;
  courseTitle?: string;
  recallStyle?: RecallStyle;
}): RecallPracticeContent {
  const {
    topicTitle,
    courseCode = "COURSE",
    courseTitle = "Subject",
    recallStyle = "questions",
  } = options;

  switch (recallStyle) {
    case "problems": {
      // Mathematics & Numerical Engineering (2-3 practice problems with reveal solutions)
      const problems: PracticeProblem[] = [
        {
          id: "p1",
          problemNumber: 1,
          statement: `State the standard formulation and evaluate the analytical expression for: "${topicTitle}". Under what conditions does the system admit a unique, non-trivial solution?`,
          hint: "Recall the governing linear operator or fundamental relation for this topic.",
          solution: `Step 1: Write down the primary formula/matrix representation associated with ${topicTitle}.\nStep 2: Apply the determinant / rank test (det(A) ≠ 0 for non-singularity).\nStep 3: Conclude that the solution exists and is unique when the coefficient matrix is full rank, verifying boundary / continuity criteria.`,
        },
        {
          id: "p2",
          problemNumber: 2,
          statement: `Solve the characteristic problem for "${topicTitle}": Determine the stationary points or eigenvalue spectrum if given the canonical form f(x) or matrix A.`,
          hint: "Set up the characteristic equation det(A - λI) = 0 or ∇f = 0.",
          solution: `Step 1: Formulate the characteristic polynomial P(λ) = det(A - λI) = 0.\nStep 2: Solve the polynomial roots to obtain eigenvalues λ₁, λ₂.\nStep 3: Substitute each λ back into (A - λI)v = 0 to extract the corresponding eigenvectors and verify orthogonality.`,
        },
        {
          id: "p3",
          problemNumber: 3,
          statement: `Practical verification: Verify whether the homogeneous condition holds for "${topicTitle}" over the domain [0, 1].`,
          hint: "Check boundary conditions at x = 0 and x = 1.",
          solution: `Step 1: Evaluate the integral or limit at the boundaries: lim(x→0⁺) and lim(x→1⁻).\nStep 2: Confirm that both boundaries satisfy Dirichlet / Neumann conditions identically.\nStep 3: The result confirms consistency across the entire interval.`,
        },
      ];

      return {
        style: "problems",
        topicTitle,
        courseCode,
        courseTitle,
        problems,
      };
    }

    case "code": {
      // Computer Science: Recall code implementation from memory
      const funcName = topicTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .slice(0, 24)
        .replace(/^_+|_+$/g, "") || "solve_topic";

      const code: CodePracticeItem = {
        prompt: `Write a complete, syntactically correct function implementing "${topicTitle}" from memory. Pay strict attention to base cases, loop termination, and space/time invariants.`,
        starterSignature: `def ${funcName}(data, target=None):\n    \"\"\"\n    Implementation of: ${topicTitle}\n    \"\"\"\n    # Write your code from memory here:\n    `,
        taskGoal: `Demonstrate that you can reproduce the core algorithmic structure of ${topicTitle} without looking at reference docs.`,
        referenceCode: `def ${funcName}(data, target=None):\n    # 1. Base / boundary guard\n    if not data:\n        return None\n        \n    # 2. Initialize pointers or state\n    result = []\n    n = len(data)\n    \n    # 3. Core iteration / transformation for ${topicTitle}\n    for i in range(n):\n        curr = data[i]\n        if target is not None and curr == target:\n            return i\n        result.append(curr)\n        \n    # 4. Return canonical structure\n    return result`,
        keyInvariants: [
          "Edge case handling for null or empty input collections",
          "Time complexity bound O(n) or O(log n) as required by the algorithm",
          "Proper termination condition to avoid off-by-one errors or infinite recursion",
        ],
      };

      return {
        style: "code",
        topicTitle,
        courseCode,
        courseTitle,
        code,
      };
    }

    case "vocabulary_and_usage": {
      // English & Professional Communication: Academic usage & terminology
      const vocabulary: VocabularyPracticeItem[] = [
        {
          term: topicTitle,
          contextPrompt: `Define "${topicTitle}" in precise academic terms. How is this concept correctly contextualized in engineering discourse without ambiguity?`,
          modelDefinition: `"${topicTitle}" denotes the formal grammatical, syntactic, or rhetorical convention utilized to establish clarity, coherence, and precision in technical and academic communication.`,
          exemplarSentence: `In empirical research papers, proper application of ${topicTitle} ensures that assertions remain rigorously grounded and accessible to interdisciplinary review panels.`,
        },
      ];

      return {
        style: "vocabulary_and_usage",
        topicTitle,
        courseCode,
        courseTitle,
        vocabulary,
      };
    }

    case "questions":
    default: {
      // Chemistry, Physics, Electrical & Mechanical Engineering: Conceptual questions
      const questions: QuestionPracticeItem[] = [
        {
          questionNumber: 1,
          question: `Explain the fundamental scientific or physical principle behind "${topicTitle}". What is the governing law or mechanism?`,
          promptGoal: "State the law, relevant variables, and their qualitative relationship.",
          modelAnswer: `The governing principle of "${topicTitle}" establishes the direct relationship between applied potential/stimulus and system response. According to constitutive laws, the magnitude of the effect is proportional to the gradient across the boundary layer, adhering strictly to conservation of energy and equilibrium states.`,
        },
        {
          questionNumber: 2,
          question: `What are the critical limitations, trade-offs, or real-world engineering constraints when applying "${topicTitle}" in practice?`,
          promptGoal: "Identify temperature, pressure, material, or efficiency boundaries.",
          modelAnswer: `In practical implementations, efficiency is bounded by parasitic losses (thermal dissipation, contact resistance, or non-ideal friction). Extreme operating temperatures or high frequency operation can cause deviation from the ideal model, requiring secondary compensation circuitry or corrective shielding.`,
        },
      ];

      return {
        style: "questions",
        topicTitle,
        courseCode,
        courseTitle,
        questions,
      };
    }
  }
}
