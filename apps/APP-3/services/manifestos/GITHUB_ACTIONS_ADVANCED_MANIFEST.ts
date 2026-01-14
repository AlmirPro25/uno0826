/**
 * 🔄 GITHUB ACTIONS ADVANCED MANIFEST
 * 
 * Domínio: CI/CD avançado com GitHub Actions
 * Especialidade: Workflows complexos, matrix builds, reusable workflows
 * 
 * @version 1.0.0
 * @author Micro-SaaS Factory
 */

export const GITHUB_ACTIONS_ADVANCED_MANIFEST = {
  id: 'github-actions-advanced',
  name: 'GitHub Actions Advanced Master',
  version: '1.0.0',
  category: 'ci-cd',
  
  activation: {
    keywords: [
      'github actions', 'ci/cd', 'workflow', 'pipeline',
      'matrix build', 'reusable workflow', 'composite action',
      'self-hosted runner', 'artifacts', 'caching',
      'environments', 'secrets', 'oidc', 'deployment'
    ],
    patterns: [/github\s*actions/i, /\.github\/workflows/i, /workflow.*yaml/i]
  },

  philosophy: {
    core: "Automate everything that can be automated. Make deployments boring.",
    principles: [
      "Fast Feedback - Fail fast, fix fast",
      "Reproducible Builds - Same input, same output",
      "Security First - Secrets management, OIDC",
      "DRY Workflows - Reusable workflows e composite actions",
      "Observability - Logs, artifacts, annotations"
    ]
  },

  templates: {
    ciWorkflow: `
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

concurrency:
  group: \${{ github.workflow }}-\${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    needs: lint
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4
        if: matrix.node == 20

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
`,
    deployWorkflow: `
# .github/workflows/deploy.yml
name: Deploy

on:
  workflow_run:
    workflows: [CI Pipeline]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: \${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789:role/GitHubActionsRole
          aws-region: us-east-1
      - run: aws s3 sync dist/ s3://my-bucket/
`
  },

  bestPractices: [
    "Use concurrency para cancelar runs duplicados",
    "Cache dependencies (npm, pip, etc)",
    "Use matrix para testar múltiplas versões",
    "OIDC ao invés de long-lived credentials",
    "Environments para approval gates",
    "Reusable workflows para DRY"
  ],

  antiPatterns: [
    "NUNCA exponha secrets em logs",
    "NUNCA use actions de terceiros sem verificar",
    "NUNCA ignore timeouts em jobs",
    "NUNCA faça deploy sem testes"
  ]
};

export default GITHUB_ACTIONS_ADVANCED_MANIFEST;
