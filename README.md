# Playwright Reporter for Sonarqube

Simplified version of [XrayApp's playwright-junit-report](https://github.com/Xray-App/playwright-junit-reporter) to support 
[Sonarqube's Generic Data Test Execution](https://docs.sonarsource.com/sonarqube/9.9/analyzing-source-code/test-coverage/generic-test-data/#generic-test-execution) format.


[![npm version](https://img.shields.io/npm/v/@bdellegrazie/playwright-sonar-reporter.svg?style=flat-square)](https://www.npmjs.com/package/@bdellegrazie/playwright-sonar-reporter)
[![build workflow](https://github.com/bdellegrazie/playwright-sonar-reporter/actions/workflows/build.yml/badge.svg)](https://github.com/bdellegrazie/playwright-sonar-reporter/actions/workflows/build.yml)
[![license](https://img.shields.io/badge/License-Apache%202-green.svg)](https://opensource.org/license/apache-2-0/)
[![Gitter chat](https://badges.gitter.im/gitterHQ/gitter.png)](https://gitter.im/bdellegrazie/community)
[![npm downloads](https://img.shields.io/npm/dm/@bdellegrazie/playwright-sonar-reporter.svg?style=flat-square)](http://npm-stat.com/charts.html?package=@bdellegrazie/playwright-sonar-reporter)

## Installation

Run the following commands:

### npm

`npm install @bdellegrazie/playwright-sonar-reporter --save-dev`

### yarn

`yarn add @bdellegrazie/playwright-sonar-reporter --dev`

## Usage

Most likely you want to write the report to an xml file. When running with `--reporter=@bdellegrazie/playwright-sonar-reporter`, use `PLAYWRIGHT_SONAR_OUTPUT_NAME` environment variable:

```bash tab=bash-bash
PLAYWRIGHT_SONAR_OUTPUT_NAME=results.xml npx playwright test --reporter=@bdellegrazie/playwright-sonar-reporter
```

```batch tab=bash-batch
set PLAYWRIGHT_SONAR_OUTPUT_NAME=results.xml
npx playwright test --reporter=@bdellegrazie/playwright-sonar-reporter
```

```powershell tab=bash-powershell
$env:PLAYWRIGHT_SONAR_OUTPUT_NAME="results.xml"
npx playwright test --reporter=@bdellegrazie/playwright-sonar-reporter
```

In configuration file, pass options directly:

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  reporter: [['@bdellegrazie/playwright-sonar-reporter', { outputFile: 'results.xml' }]],
});
```

The Sonar reporter has no options beyond the outputFile property. 

## TO DOs

- implement code coverage

## Contact

Any questions related with this code, please raise issues in this GitHub project. Feel free to contribute and submit PR's.

## References

- [Sonarqube Generic Test Execution Report](https://docs.sonarsource.com/sonarqube/9.9/analyzing-source-code/test-coverage/generic-test-data/#generic-test-execution)

## LICENSE

Based on code from [Playwright](https://github.com/microsoft/playwright/) project and [Xray-App's playwright-junit-report](https://github.com/Xray-App/playwright-junit-reporter)

[Apache License v2.0](LICENSE)
