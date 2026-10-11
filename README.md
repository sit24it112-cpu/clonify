# PS-23: AI-Powered Code Similarity & Plagiarism Risk Detection System

A production-grade academic integrity and code similarity analysis platform engineered for computer science educators, reviewers, and institutions. Supports multi-dimensional comparative analysis of **Python** (`.py`) and **Java** (`.java`) student submissions using lexical, syntactic AST, and calibrated machine learning models.

---

## 1. System Architecture & Workflow

Based directly on the **PS-23 Code Plagiarism Detection End-to-End Workflow**:

```
[1. Input / Upload] (.py & .java files, batch ID, threshold slider)
         ↓
[2. Validation & Preprocessing] (syntax validation, comment/whitespace removal, identifier normalization)
         ↓
[3. Feature Extraction] (Token N-gram Jaccard/Cosine, TF-IDF, AST syntax trees, Winnowing fingerprints)
         ↓
[4. ML Model Inference] (Python: Calibrated Random Forest | Java: HistGradientBoosting)
         ↓
[5. Score Calculation & Classification] (0–30 Green Low, 31–75 Yellow Moderate, 76–100 Red High)
         ↓
[6. Report Generation] (Downloadable PDF dossiers and JSON audit trails)
         ↓
[7. Human Review] (Mandatory instructor inspection: evidence diff, decision notes, compliance log)
```

---

## 2. Key Capabilities & Mathematical Formulation

### A. Preprocessing & Identifier Normalization
- **Safe Static Inspection**: Submitted student code is never executed (`eval()` / `exec()` strictly prohibited).
- **Line-Preserving Stripping**: Removes single-line (`#`, `//`) and block (`"""`, `/* ... */`) comments while keeping line numbers 1:1 for side-by-side highlighting.
- **Identifier Normalization**: Maps variable, parameter, and method names to positional tokens (`ID_1`, `ID_2`, etc.) to detect renamed-variable refactoring.

### B. Similarity Feature Extraction
1. **Token N-Gram Jaccard**: 3-gram sequence overlap over normalized tokens.
2. **TF-IDF Vector Cosine**: Term-frequency inverse document frequency across the submission batch.
3. **AST & Syntax Structural Trees**:
   - Python: Extracts syntax node hierarchies, loop constructs, conditionals, function counts, and cyclomatic branching complexity.
   - Java: Extracts class signatures, method patterns, control-flow statements (`for`, `while`, `if`, `switch`, `try-catch`), and nesting depth.
4. **Winnowing Fingerprinting**: Rabin-Karp polynomial rolling hash with sliding window to identify partial code blocks and copied snippets.

### C. Machine Learning Inference & Calibration
- **Python Model**: Calibrated `RandomForestClassifier` (150 trees) with Platt Sigmoid / Isotonic probability scaling.
- **Java Model**: `HistGradientBoostingClassifier` with L2 regularization.
- **Baseline Model**: Regularized `LogisticRegression` baseline.
- **Composite Scoring Formula**:
  $$\text{Score} = 0.45 \times \text{ML\_Calibrated} + 0.30 \times \text{Lexical} + 0.25 \times \text{Structural}$$

### D. Score Presentation Zones
- **0–30 (Green - Low Similarity)**: Normal variation; independent implementation logic.
- **31–75 (Yellow - Moderate Similarity)**: Shared algorithmic structure, common assignment boilerplate, or standard library idioms.
- **76–100 (Red - High Similarity)**: Strong structural and lexical alignment. Automatically flagged for instructor review.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, tabular numerals.
- **Backend**: Node.js 22, Express, TypeScript (`tsx`).
- **Persistence**: SQLite using Node 22's built-in `node:sqlite` (`DatabaseSync`).
- **Code Analysis**: Safe static tokenizers, Python AST analyzer bridge, Winnowing fingerprinting.
- **Reports**: Machine-readable JSON export & High-fidelity printable PDF dossiers.

---

## 4. Local Development Setup

### Prerequisites
- **Node.js**: v20+ or v22+
- **Python**: 3.10+ (for optional deep AST verification)

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd ps23-plagiarism-detection

# Install Node dependencies
npm install
```

### Running the Full-Stack Application
```bash
# Starts Express backend and Vite frontend on Port 3000
npm run dev
```

Open your browser at `http://localhost:3000`.

### Running Automated Test Suite
```bash
npx tsx tests/engine.test.ts
```

Output:
```
=== Running PS-23 Automated Verification Tests ===
✓ [PASS] Python Preprocessing & Comment Stripping
✓ [PASS] Java Preprocessing & Comment Stripping
✓ [PASS] Language-Aware Tokenization
✓ [PASS] Identifier Normalization mapping
✓ [PASS] Python AST Analysis & Loop/Conditional Counts
✓ [PASS] Java Syntax Analysis & Class/Method Parsing
✓ [PASS] Lexical N-Gram Jaccard Calculation
✓ [PASS] Winnowing Fingerprinting Overlap
✓ [PASS] Contiguous Matched Code Regions Finder
✓ [PASS] ML Model Inference & Zone Mapping
✓ [PASS] End-to-End Python Pipeline on Refactored Pair
✓ [PASS] SQLite Persistence & Retrieval
=== Verification Results: 12 Passed, 0 Failed ===
```

---

## 5. REST API Documentation

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System status, version, and global KPI statistics |
| `GET` | `/api/model/status` | Active ML models, versions, and supported feature vectors |
| `GET` | `/api/model/metrics` | Quantitative evaluation benchmarks (F1, Precision, Recall, AUC, Confusion Matrix) |
| `POST` | `/api/analyze` | Ingests batch of `.py` & `.java` files, executes pipeline, stores in SQLite |
| `GET` | `/api/analyses` | Lists historical analysis sessions |
| `GET` | `/api/analyses/:id` | Full analysis summary with all pairwise results and submissions |
| `DELETE` | `/api/analyses/:id` | Deletes analysis and cascading database records |
| `GET` | `/api/pairs/:id/evidence`| Side-by-side evidence with line numbers, tokens, and matched regions |
| `GET` | `/api/reviews` | Retrieves human review decision audit log |
| `POST` | `/api/reviews` | Logs instructor decision ('potential_plagiarism', 'reviewed_clean', etc.) |
| `GET` | `/api/reports/:id/json` | Downloads structured JSON dossier |
| `GET` | `/api/reports/:id/pdf` | Renders printable academic integrity PDF report |
| `POST` | `/api/samples/load` | Re-seeds database with verified academic benchmark submissions |

---

## 6. Security, Privacy & Integrity Notice

- **No Code Execution**: Submissions are strictly tokenized and parsed into AST hierarchies. No user code is executed.
- **Data Isolation**: Submissions are grouped by assignment batch ID; isolated from external networks.
- **Mandatory Human Review**: Similarity scores reflect pattern alignment, not moral guilt. High scores may arise from shared starter code or common algorithms. Human instructor review is legally and academically mandatory.
