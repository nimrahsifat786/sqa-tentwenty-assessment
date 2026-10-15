# Playwright JS

End-to-end browser tests for the SauceDemo checkout flow, using Playwright Test and Chromium.

## Prerequisites

- Node.js 20 or later
- npm

## Setup

1. Clone the repository and open its directory:

   ```bash
   git clone <repository-url>
   cd playwright_js
   ```

2. Install the project dependencies:

   ```bash
   npm ci
   ```

3. Install the Chromium browser used by the tests:

   ```bash
   npx playwright install chromium
   ```

## Run the tests

Run the suite in headless mode:

```bash
npm test
```

Run it with a visible browser:

```bash
npm run test:headed
```

The tests use `https://www.saucedemo.com` and the `standard_user` demo account by default. To override these values, set `SAUCEDEMO_URL`, `SAUCEDEMO_USERNAME`, or `SAUCEDEMO_PASSWORD` in the environment before running the tests.

Playwright saves test output, including the generated order PDF, under `test-results/`.
