/**
 * PS-23 AST & Structural Code Analysis
 * Extracts syntax tree node patterns, control-flow metrics, and structural hashes for Python and Java.
 */

import { SupportedLanguage, StructuralMetrics, TokenInfo } from './types';
import { spawnSync } from 'child_process';

/**
 * Extracts Python AST metrics using python3 if available, or structural tokenizer fallback.
 */
export function analyzePythonStructure(code: string, tokens: TokenInfo[]): StructuralMetrics {
  // Try using Python's native ast module via safe subprocess
  try {
    const pythonScript = `
import ast, json, sys

code = sys.stdin.read()
try:
    tree = ast.parse(code)
except Exception as e:
    sys.exit(1)

node_types = {}
max_depth = 0
func_count = 0
loop_count = 0
cond_count = 0
ret_count = 0
total_nodes = 0
subtrees = []

def walk_tree(node, depth=1):
    global max_depth, func_count, loop_count, cond_count, ret_count, total_nodes
    total_nodes += 1
    if depth > max_depth:
        max_depth = depth
    
    tname = type(node).__name__
    node_types[tname] = node_types.get(tname, 0) + 1
    
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
        func_count += 1
        subtrees.append(f"Func:{node.name}:{len(node.args.args)}")
    elif isinstance(node, (ast.For, ast.AsyncFor, ast.While)):
        loop_count += 1
        subtrees.append(f"Loop:{tname}")
    elif isinstance(node, (ast.If,)):
        cond_count += 1
        subtrees.append(f"Cond:{tname}")
    elif isinstance(node, (ast.Return,)):
        ret_count += 1

    for child in ast.iter_child_nodes(node):
        walk_tree(child, depth + 1)

walk_tree(tree)

print(json.dumps({
    "totalNodes": total_nodes,
    "maxDepth": max_depth,
    "functionCount": func_count,
    "loopCount": loop_count,
    "conditionalCount": cond_count,
    "returnCount": ret_count,
    "branchingComplexity": loop_count * 2 + cond_count,
    "nodeTypes": node_types,
    "subtreeHashes": subtrees[:50]
}))
`;

    const res = spawnSync('python3', ['-c', pythonScript], {
      input: code,
      encoding: 'utf-8',
      timeout: 3000
    });

    if (res.status === 0 && res.stdout) {
      const parsed = JSON.parse(res.stdout);
      return parsed as StructuralMetrics;
    }
  } catch (err) {
    // Fall back to robust token-level structural extraction
  }

  return analyzeTokenStructure(tokens, 'python');
}

/**
 * Extracts Java structural syntax and control-flow patterns.
 */
export function analyzeJavaStructure(code: string, tokens: TokenInfo[]): StructuralMetrics {
  return analyzeTokenStructure(tokens, 'java');
}

/**
 * Robust structural parser that builds block trees, loops, conditionals, functions, and depth.
 */
function analyzeTokenStructure(tokens: TokenInfo[], language: SupportedLanguage): StructuralMetrics {
  const nodeTypes: Record<string, number> = {};
  let currentDepth = 0;
  let maxDepth = 0;
  let functionCount = 0;
  let loopCount = 0;
  let conditionalCount = 0;
  let returnCount = 0;
  const subtrees: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const val = t.value;

    if (val === '{' || (language === 'python' && val === ':')) {
      currentDepth++;
      if (currentDepth > maxDepth) maxDepth = currentDepth;
    } else if (val === '}') {
      if (currentDepth > 0) currentDepth--;
    }

    if (t.type === 'keyword') {
      nodeTypes[val] = (nodeTypes[val] || 0) + 1;

      if (language === 'python') {
        if (val === 'def') {
          functionCount++;
          const next = tokens[i + 1];
          if (next && next.type === 'identifier') {
            subtrees.push(`Func:${next.value}`);
          }
        } else if (val === 'for' || val === 'while') {
          loopCount++;
          subtrees.push(`Loop:${val}@${currentDepth}`);
        } else if (val === 'if' || val === 'elif') {
          conditionalCount++;
          subtrees.push(`Cond:${val}@${currentDepth}`);
        } else if (val === 'return') {
          returnCount++;
        }
      } else {
        // Java
        if (val === 'for' || val === 'while' || val === 'do') {
          loopCount++;
          subtrees.push(`Loop:${val}@${currentDepth}`);
        } else if (val === 'if' || val === 'switch') {
          conditionalCount++;
          subtrees.push(`Cond:${val}@${currentDepth}`);
        } else if (val === 'return') {
          returnCount++;
        } else if (val === 'class') {
          nodeTypes['class'] = (nodeTypes['class'] || 0) + 1;
        } else if (['public', 'private', 'protected', 'void', 'static'].includes(val)) {
          // Look ahead for method signature
          if (i + 2 < tokens.length && tokens[i + 2].value === '(') {
            functionCount++;
            subtrees.push(`Method:${tokens[i + 1].value}`);
          }
        }
      }
    }
  }

  // Branching complexity formula (Cyclomatic proxy)
  const branchingComplexity = loopCount * 2 + conditionalCount + 1;

  return {
    totalNodes: tokens.length,
    maxDepth: Math.max(1, maxDepth),
    functionCount: Math.max(1, functionCount),
    loopCount,
    conditionalCount,
    returnCount,
    branchingComplexity,
    nodeTypes,
    subtreeHashes: subtrees
  };
}

/**
 * Computes structural similarity ratio between two AST metric summaries.
 */
export function computeStructuralSimilarity(m1: StructuralMetrics, m2: StructuralMetrics): number {
  // 1. Node type overlap (Cosine / Weighted Jaccard)
  const allTypes = new Set([...Object.keys(m1.nodeTypes), ...Object.keys(m2.nodeTypes)]);
  let typeIntersection = 0;
  let typeUnion = 0;

  for (const t of allTypes) {
    const c1 = m1.nodeTypes[t] || 0;
    const c2 = m2.nodeTypes[t] || 0;
    typeIntersection += Math.min(c1, c2);
    typeUnion += Math.max(c1, c2);
  }
  const typeSimilarity = typeUnion > 0 ? typeIntersection / typeUnion : 1.0;

  // 2. Control flow construct similarity (loops, conditionals, functions)
  const loopDelta = Math.abs(m1.loopCount - m2.loopCount);
  const loopMax = Math.max(1, Math.max(m1.loopCount, m2.loopCount));
  const loopSim = 1.0 - (loopDelta / loopMax);

  const condDelta = Math.abs(m1.conditionalCount - m2.conditionalCount);
  const condMax = Math.max(1, Math.max(m1.conditionalCount, m2.conditionalCount));
  const condSim = 1.0 - (condDelta / condMax);

  const funcDelta = Math.abs(m1.functionCount - m2.functionCount);
  const funcMax = Math.max(1, Math.max(m1.functionCount, m2.functionCount));
  const funcSim = 1.0 - (funcDelta / funcMax);

  // 3. Subtree signature overlap
  const s1 = new Set(m1.subtreeHashes);
  const s2 = new Set(m2.subtreeHashes);
  let subtreeMatches = 0;
  for (const item of s1) {
    if (s2.has(item)) subtreeMatches++;
  }
  const subtreeTotal = Math.max(1, Math.max(s1.size, s2.size));
  const subtreeSim = subtreeMatches / subtreeTotal;

  // Weighted composite structural score
  const structuralScore = (
    0.35 * typeSimilarity +
    0.25 * loopSim +
    0.20 * condSim +
    0.10 * funcSim +
    0.10 * subtreeSim
  );

  return Math.max(0, Math.min(1.0, structuralScore));
}
