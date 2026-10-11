/**
 * PS-23 Language-Aware Preprocessor and Tokenizer
 * Safely parses and normalizes Python and Java source code without code execution.
 */

import { SupportedLanguage, TokenInfo } from './types';

// Python language reserved keywords
const PYTHON_KEYWORDS = new Set([
  'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue', 'def',
  'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if',
  'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise',
  'return', 'try', 'while', 'with', 'yield', 'True', 'False', 'None'
]);

// Java language reserved keywords
const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char',
  'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum',
  'extends', 'final', 'finally', 'float', 'for', 'goto', 'if', 'implements',
  'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static',
  'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws',
  'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null',
  'var', 'record', 'sealed', 'permits'
]);

export interface PreprocessedSource {
  language: SupportedLanguage;
  originalLines: string[];
  cleanLines: string[];
  tokens: TokenInfo[];
  normalizedTokens: TokenInfo[];
  normalizedString: string;
  tokenFrequencies: Map<string, number>;
  identifierMap: Map<string, string>;
  parseStatus: 'success' | 'warning' | 'error';
  parseError?: string;
}

/**
 * Strips comments and returns cleaned source lines while keeping line indices 1:1.
 */
export function stripComments(code: string, language: SupportedLanguage): string[] {
  const lines = code.split(/\r?\n/);
  const cleanLines: string[] = [];
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (language === 'python') {
      // Handle Python multi-line triple quote comments if standalone
      if (!inBlockComment && (line.includes('"""') || line.includes("'''"))) {
        const marker = line.includes('"""') ? '"""' : "'''";
        const firstIdx = line.indexOf(marker);
        const secondIdx = line.indexOf(marker, firstIdx + 3);
        if (secondIdx !== -1) {
          // Block quote open and closed on same line
          line = line.slice(0, firstIdx) + line.slice(secondIdx + 3);
        } else {
          inBlockComment = true;
          line = line.slice(0, firstIdx);
        }
      } else if (inBlockComment) {
        if (line.includes('"""') || line.includes("'''")) {
          const marker = line.includes('"""') ? '"""' : "'''";
          const endIdx = line.indexOf(marker);
          inBlockComment = false;
          line = line.slice(endIdx + 3);
        } else {
          line = '';
        }
      }

      // Single line Python comment (#)
      const hashIdx = line.indexOf('#');
      if (hashIdx !== -1 && !inBlockComment) {
        // Simple string check to avoid stripping # inside quotes
        const before = line.slice(0, hashIdx);
        const doubleQuotes = (before.match(/"/g) || []).length;
        const singleQuotes = (before.match(/'/g) || []).length;
        if (doubleQuotes % 2 === 0 && singleQuotes % 2 === 0) {
          line = before;
        }
      }
    } else {
      // Java comments
      if (inBlockComment) {
        const endIdx = line.indexOf('*/');
        if (endIdx !== -1) {
          inBlockComment = false;
          line = line.slice(endIdx + 2);
        } else {
          line = '';
        }
      }

      // Check for block comment start
      if (!inBlockComment) {
        const blockStart = line.indexOf('/*');
        if (blockStart !== -1) {
          const blockEnd = line.indexOf('*/', blockStart + 2);
          if (blockEnd !== -1) {
            line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
          } else {
            inBlockComment = true;
            line = line.slice(0, blockStart);
          }
        }
      }

      // Single line comment //
      const slashIdx = line.indexOf('//');
      if (slashIdx !== -1 && !inBlockComment) {
        const before = line.slice(0, slashIdx);
        const quotes = (before.match(/"/g) || []).length;
        if (quotes % 2 === 0) {
          line = before;
        }
      }
    }

    cleanLines.push(line.trimEnd());
  }

  return cleanLines;
}

/**
 * Tokenize source code for Python and Java.
 */
export function tokenizeSource(code: string, language: SupportedLanguage): { tokens: TokenInfo[]; error?: string } {
  const lines = code.split(/\r?\n/);
  const tokens: TokenInfo[] = [];
  const keywords = language === 'python' ? PYTHON_KEYWORDS : JAVA_KEYWORDS;

  // Regex patterns
  // Identifier or keyword: [a-zA-Z_$][a-zA-Z0-9_$]*
  // Numbers: \b\d+(\.\d+)?([eE][+-]?\d+)?\b
  // Strings: "([^"\\]|\\.)*" or '([^'\\]|\\.)*'
  // Operators & delimiters: special symbols
  const tokenRegex = language === 'python'
    ? new RegExp('(?:#.*$)|(?:"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')|(?:\\b\\d+(?:\\.\\d+)?\\b)|(?:[a-zA-Z_][a-zA-Z0-9_]*)|(?:==|!=|<=|>=|\\+=|-=|\\*=|/=|//=|\\*\\*=|>>|<<|->|\\*\\*|//|[+*/%&=|<>!^~(),:;.\\[\\]{}-])', 'g')
    : new RegExp('(?:\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|(?:"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\')|(?:\\b\\d+(?:\\.\\d+)?(?:[fFdDlL])?\\b)|(?:[a-zA-Z_$][a-zA-Z0-9_$]*)|(?:==|!=|<=|>=|\\+=|-=|\\*=|/=|&&|\\|\\||\\+\\+|--|>>>|>>|<<|[+*/%&=|<>!^~(),:;.\\[\\]{}-])', 'g');

  let inMultilineComment = false;

  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const line = lines[lineNum - 1];
    let match: RegExpExecArray | null;

    tokenRegex.lastIndex = 0;
    while ((match = tokenRegex.exec(line)) !== null) {
      const val = match[0];
      const col = match.index + 1;

      // Skip Python comments
      if (language === 'python' && val.startsWith('#')) {
        continue;
      }

      // Skip Java comments
      if (language === 'java') {
        if (val.startsWith('//')) continue;
        if (val.startsWith('/*')) {
          if (!val.endsWith('*/')) inMultilineComment = true;
          continue;
        }
      }

      if (inMultilineComment) {
        if (val.includes('*/')) inMultilineComment = false;
        continue;
      }

      let type = 'delimiter';
      if (keywords.has(val)) {
        type = 'keyword';
      } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(val)) {
        type = 'identifier';
      } else if (/^\d/.test(val)) {
        type = 'number';
      } else if (val.startsWith('"') || val.startsWith("'")) {
        type = 'string';
      } else if (/^[+\-*/%&=|<>!^~]/.test(val)) {
        type = 'operator';
      }

      tokens.push({
        type,
        value: val,
        line: lineNum,
        column: col
      });
    }
  }

  return { tokens };
}

/**
 * Normalizes identifier names to stable placeholder symbols (e.g. v1, v2, v3...)
 * to detect code with renamed variables or refactored names.
 */
export function normalizeIdentifiers(tokens: TokenInfo[]): {
  normalizedTokens: TokenInfo[];
  identifierMap: Map<string, string>;
  normalizedString: string;
} {
  const identifierMap = new Map<string, string>();
  const normalizedTokens: TokenInfo[] = [];
  let idCounter = 1;

  for (const token of tokens) {
    if (token.type === 'identifier') {
      if (!identifierMap.has(token.value)) {
        identifierMap.set(token.value, `ID_${idCounter++}`);
      }
      const normVal = identifierMap.get(token.value)!;
      normalizedTokens.push({
        ...token,
        normalized: normVal
      });
    } else if (token.type === 'number') {
      normalizedTokens.push({
        ...token,
        normalized: 'NUM'
      });
    } else if (token.type === 'string') {
      normalizedTokens.push({
        ...token,
        normalized: 'STR'
      });
    } else {
      normalizedTokens.push({
        ...token,
        normalized: token.value
      });
    }
  }

  const normalizedString = normalizedTokens.map(t => t.normalized || t.value).join(' ');

  return {
    normalizedTokens,
    identifierMap,
    normalizedString
  };
}

/**
 * Full preprocessing pipeline
 */
export function preprocessCode(rawCode: string, language: SupportedLanguage): PreprocessedSource {
  const originalLines = rawCode.split(/\r?\n/);
  const cleanLines = stripComments(rawCode, language);
  const { tokens, error: tokenError } = tokenizeSource(rawCode, language);
  const { normalizedTokens, identifierMap, normalizedString } = normalizeIdentifiers(tokens);

  const tokenFrequencies = new Map<string, number>();
  for (const t of normalizedTokens) {
    const key = t.normalized || t.value;
    tokenFrequencies.set(key, (tokenFrequencies.get(key) || 0) + 1);
  }

  return {
    language,
    originalLines,
    cleanLines,
    tokens,
    normalizedTokens,
    normalizedString,
    tokenFrequencies,
    identifierMap,
    parseStatus: tokenError ? 'warning' : 'success',
    parseError: tokenError
  };
}
