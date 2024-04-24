/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';

import type { FullConfig, FullResult, Reporter, Suite, TestCase } from '@playwright/test/reporter';
import { stripAnsiEscapes } from './base.js';
import { assert } from 'playwright-core/lib/utils';

export function monotonicTime(): number {
  const [seconds, nanoseconds] = process.hrtime();
  return seconds * 1000 + (nanoseconds / 1000 | 0) / 1000;
}

class SonarReporter implements Reporter {
  private config!: FullConfig;
  private suite!: Suite;
  private startTime!: number;
  private outputFile: string | undefined;
  private resolvedOutputFile: string | undefined;
  private stripANSIControlSequences = false;


  constructor(options: { outputFile?: string, stripANSIControlSequences?: boolean, embedAnnotationsAsProperties?: boolean, textContentAnnotations?: string[], embedAttachmentsAsProperty?: string } = {}) {
    this.outputFile = options.outputFile || reportOutputNameFromEnv();
    this.stripANSIControlSequences = options.stripANSIControlSequences || false;
  }

  printsToStdio() {
    return !this.outputFile;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.suite = suite;
    this.startTime = monotonicTime();
    if (this.outputFile) {
      assert(this.config.configFile || path.isAbsolute(this.outputFile), 'Expected fully resolved path if not using config file.');
      this.resolvedOutputFile = this.config.configFile ? path.resolve(path.dirname(this.config.configFile), this.outputFile) : this.outputFile;
    }
  }

  async onEnd(result: FullResult) {
    const children: XMLEntry[] = [];
    for (const projectSuite of this.suite.suites) {
      for (const fileSuite of projectSuite.suites)
        children.push(await this._buildTestSuite(fileSuite));
    }
    const tokens: string[] = [];

    const root: XMLEntry = {
      name: 'testExecutions',
      attributes: {
        version: '1',
      },
      children
    };

    serializeXML(root, tokens, this.stripANSIControlSequences);
    const reportString = tokens.join('\n');
    if (this.resolvedOutputFile) {
      await fs.promises.mkdir(path.dirname(this.resolvedOutputFile), { recursive: true });
      await fs.promises.writeFile(this.resolvedOutputFile, reportString);
    } else {
      console.log(reportString);
    }
  }

  private async _buildTestSuite(suite: Suite): Promise<XMLEntry> {
    const children: XMLEntry[] = [];

    for (const test of suite.allTests())
      await this._addTestCase(test, children);

    const entry: XMLEntry = {
      name: 'file',
      attributes: {
        path: suite.location?.file,
      },
      children
    };

    return entry;
  }

  private async _addTestCase(test: TestCase, entries: XMLEntry[]) {
    const entry = {
      name: 'testCase',
      attributes: {
        // Skip root, project, file
        name: test.titlePath().slice(3).join(' › '),
        duration: (test.results.reduce((acc, value) => acc + value.duration, 0)).toFixed(0)
      },
      children: [] as XMLEntry[]
    };
    entries.push(entry);

    if (test.outcome() === 'skipped') {
      entry.children.push({ name: 'skipped' });
      return;
    }

    if (!test.ok()) {
      entry.children.push({ name: 'failure' });
      return;
    }

    // There is no equivalent to error in this model
  }
}

type XMLEntry = {
  name: string;
  attributes?: { [name: string]: string | number | boolean };
  children?: XMLEntry[];
  text?: string;
};

function serializeXML(entry: XMLEntry, tokens: string[], stripANSIControlSequences: boolean) {
  const attrs: string[] = [];
  for (const [name, value] of Object.entries(entry.attributes || {}))
    attrs.push(`${name}="${escape(String(value), stripANSIControlSequences, false)}"`);
  tokens.push(`<${entry.name}${attrs.length ? ' ' : ''}${attrs.join(' ')}>`);
  for (const child of entry.children || [])
    serializeXML(child, tokens, stripANSIControlSequences);
  if (entry.text)
    tokens.push(escape(entry.text, stripANSIControlSequences, true));
  tokens.push(`</${entry.name}>`);
}

// See https://en.wikipedia.org/wiki/Valid_characters_in_XML
const discouragedXMLCharacters = /[\u0000-\u0008\u000b-\u000c\u000e-\u001f\u007f-\u0084\u0086-\u009f]/g;

function escape(text: string, stripANSIControlSequences: boolean, isCharacterData: boolean): string {
  if (stripANSIControlSequences)
    text = stripAnsiEscapes(text);

  if (isCharacterData) {
    text = '<![CDATA[' + text.replace(/]]>/g, ']]&gt;') + ']]>';
  } else {
    const escapeRe = /[&"'<>]/g;
    text = text.replace(escapeRe, c => ({ '&': '&amp;', '"': '&quot;', "'": '&apos;', '<': '&lt;', '>': '&gt;' }[c]!));
  }

  text = text.replace(discouragedXMLCharacters, '');
  return text;
}

function reportOutputNameFromEnv(): string | undefined {
  if (process.env[`PLAYWRIGHT_SONAR_OUTPUT_NAME`])
    return path.resolve(process.cwd(), process.env[`PLAYWRIGHT_SONAR_OUTPUT_NAME`]);
  return undefined;
}

export default SonarReporter;
