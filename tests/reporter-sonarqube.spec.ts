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

import xml2js from 'xml2js';
import path from 'path';
import { test, expect } from './playwright-test-fixtures.js';

const __dirname = import.meta.dirname;
const THIS_REPORTER = path.join(__dirname, '../dist/index.js');

test('should render expected', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async ({}) => {
        expect(1).toBe(1);
      });
    `,
    'b.test.js': `
      import { test, expect } from '@playwright/test';
      test('two', async ({}) => {
        expect(1).toBe(1);
      });
    `,
  }, { reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(2);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][1]['$']['path']).toContain('b.test.js');
  expect(xml['testExecutions']['file'][1]['testCase'].length).toBe(1);
  expect(xml['testExecutions']['file'][1]['testCase'][0]['$']['name']).toBe('two');
  expect(result.exitCode).toBe(0);
});

test('should render failure', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async ({}) => {
        expect(1).toBe(0);
      });
    `,
  }, { reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][0]['testCase'][0]).toHaveProperty('failure');

  expect(result.exitCode).toBe(1);
});

test('should render failure after retry and unexpected', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async ({}) => {
        expect(1).toBe(0);
      });
    `,
  }, { retries: 3, reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][0]['testCase'][0]).toHaveProperty('failure');

  expect(result.exitCode).toBe(1);
});

test('should render after flaky success', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async ({}, testInfo) => {
        expect(testInfo.retry).toBe(3);
      });
    `,
  }, { retries: 3, reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][0]['testCase'][0]).not.toHaveProperty('failure');
});

test('should render skipped', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async () => {
        console.log('Hello world');
      });
      test.skip('two', async () => {
        console.log('Hello world');
      });
    `,
  }, { reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(2);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][0]['testCase'][1]['$']['name']).toBe('two');
  expect(xml['testExecutions']['file'][0]['testCase'][1]).toHaveProperty('skipped');

  expect(result.exitCode).toBe(0);
});

test('fixme should render as skipped', async ({ runInlineTest }) => {
  const result = await runInlineTest({
    'a.test.js': `
      import { test, expect } from '@playwright/test';
      test('one', async () => {
        console.log('Hello world');
      });
      test.fixme('two', async () => {
        console.log('Hello world');
      });
    `,
  }, { reporter: THIS_REPORTER });
  const xml = parseXML(result.output);
  expect(xml['testExecutions']['$']['version']).toBe('1');
  expect(xml['testExecutions']['file'].length).toBe(1);
  expect(xml['testExecutions']['file'][0]['$']['path']).toContain('a.test.js');
  expect(xml['testExecutions']['file'][0]['testCase'].length).toBe(2);
  expect(xml['testExecutions']['file'][0]['testCase'][0]['$']['name']).toBe('one');
  expect(xml['testExecutions']['file'][0]['testCase'][1]['$']['name']).toBe('two');
  expect(xml['testExecutions']['file'][0]['testCase'][1]).toHaveProperty('skipped');

  expect(result.exitCode).toBe(0);
});

function parseXML(xml: string): any {
  let result: any;
  xml2js.parseString(xml, (err, r) => result = r);
  return result;
}
