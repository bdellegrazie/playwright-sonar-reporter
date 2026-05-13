import process from 'process';

// Code copied from the Playwright codebase because it's not exported

export function assert(value: any, message?: string): asserts value {
  if (!value)
    throw new Error(message || 'Assertion error');
}

export function monotonicTime(): number {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + (nanoseconds / 1000000 | 0);
}

/* eslint-disable no-control-regex */
export const ansiRegex = new RegExp('([\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~])))', 'g');
export function stripAnsiEscapes(str: string): string {
  return str.replace(ansiRegex, '');
}
