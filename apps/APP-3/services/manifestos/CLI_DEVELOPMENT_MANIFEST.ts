/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║  💻 CLI DEVELOPMENT SUPREME MASTER - O Arquiteto de Ferramentas de Linha  ║
 * ║                                                                           ║
 * ║  "A melhor interface é aquela que não precisa de interface."              ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

export const CLI_DEVELOPMENT_MANIFEST = `
# 💻 CLI DEVELOPMENT SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- CLI, Command Line, Terminal App
- Commander, Inquirer, Yargs, Oclif
- Chalk, Ora, Figlet, Boxen
- npx, npm package, bin, global package
- Dev Tools, Scaffolding, Generator, Code Generator
- Interactive prompts, Progress bars, Spinners

## FILOSOFIA
> "A melhor interface é aquela que não precisa de interface."

### Princípios Invioláveis
1. **Unix Philosophy** - Faça uma coisa bem feita
2. **Fail Fast** - Erros claros e imediatos
3. **Progressive Disclosure** - Simples por padrão, poderoso quando necessário
4. **Composability** - Funcione bem com pipes e outros comandos
5. **Feedback** - Sempre mostre o que está acontecendo
6. **Idempotency** - Rodar duas vezes = mesmo resultado

## ARQUITETURA DE CLI

\`\`\`
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CLI ARCHITECTURE                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT                    PROCESSING                OUTPUT                  │
│  ┌─────────┐             ┌─────────┐              ┌─────────┐              │
│  │ Args    │             │ Parser  │              │ Stdout  │              │
│  │ Stdin   │ ──────────▶ │ Validate│ ───────────▶ │ Stderr  │              │
│  │ Config  │             │ Execute │              │ Files   │              │
│  │ Env     │             │         │              │ Exit    │              │
│  └─────────┘             └─────────┘              └─────────┘              │
│                                                                             │
│  STRUCTURE                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  my-cli <command> [subcommand] [options] [arguments]                │   │
│  │                                                                     │   │
│  │  Examples:                                                          │   │
│  │  $ my-cli create app --template next --typescript                   │   │
│  │  $ my-cli generate component Button --path src/components           │   │
│  │  $ my-cli deploy --env production --dry-run                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
\`\`\`

## COMMANDER.JS

\`\`\`typescript
#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

const program = new Command();

program
  .name('my-cli')
  .description('My awesome CLI tool')
  .version('1.0.0');

program
  .command('create <name>')
  .description('Create a new project')
  .option('-t, --template <template>', 'Template to use', 'default')
  .option('--typescript', 'Use TypeScript', false)
  .action(async (name, options) => {
    const spinner = ora('Creating project...').start();
    
    try {
      await createProject(name, options);
      spinner.succeed(chalk.green(\`Project \${name} created!\`));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      process.exit(1);
    }
  });

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate a component/page/etc')
  .action(async (type, name) => {
    console.log(chalk.blue(\`Generating \${type}: \${name}\`));
    await generateFile(type, name);
  });

program.parse();
\`\`\`

## INQUIRER (Interactive Prompts)

\`\`\`typescript
import inquirer from 'inquirer';

async function promptProjectConfig() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input) => input.length > 0 || 'Name is required',
    },
    {
      type: 'list',
      name: 'template',
      message: 'Select a template:',
      choices: ['Next.js', 'Vite', 'Express', 'NestJS'],
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features:',
      choices: [
        { name: 'TypeScript', checked: true },
        { name: 'ESLint', checked: true },
        { name: 'Prettier', checked: true },
        { name: 'Testing', checked: false },
      ],
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      default: true,
    },
  ]);

  return answers;
}
\`\`\`

## STYLING OUTPUT

\`\`\`typescript
import chalk from 'chalk';
import boxen from 'boxen';
import figlet from 'figlet';

// Banner
console.log(
  chalk.cyan(figlet.textSync('My CLI', { horizontalLayout: 'full' }))
);

// Colored output
console.log(chalk.green('✓ Success'));
console.log(chalk.red('✗ Error'));
console.log(chalk.yellow('⚠ Warning'));
console.log(chalk.blue('ℹ Info'));

// Box
console.log(
  boxen(chalk.green('Project created successfully!'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
  })
);
\`\`\`

## PACKAGE.JSON

\`\`\`json
{
  "name": "my-cli",
  "version": "1.0.0",
  "bin": {
    "my-cli": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "dev": "tsup src/index.ts --watch"
  }
}
\`\`\`

## PROGRESS & SPINNERS

\`\`\`typescript
import ora from 'ora';
import cliProgress from 'cli-progress';

// Spinner
const spinner = ora('Loading...').start();
await doSomething();
spinner.succeed('Done!');

// Progress bar
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
bar.start(100, 0);
for (let i = 0; i <= 100; i++) {
  bar.update(i);
  await sleep(50);
}
bar.stop();
\`\`\`

## OCLIF (Enterprise CLI Framework)

\`\`\`typescript
// src/commands/create.ts
import { Command, Flags } from '@oclif/core';
import { input, select, confirm } from '@inquirer/prompts';

export default class Create extends Command {
  static description = 'Create a new project';
  
  static examples = [
    '<%= config.bin %> create my-app',
    '<%= config.bin %> create my-app --template next --typescript',
  ];
  
  static flags = {
    template: Flags.string({
      char: 't',
      description: 'Template to use',
      options: ['next', 'vite', 'express'],
      default: 'next',
    }),
    typescript: Flags.boolean({
      description: 'Use TypeScript',
      default: true,
    }),
    'dry-run': Flags.boolean({
      description: 'Show what would be created',
      default: false,
    }),
  };
  
  static args = {
    name: Args.string({
      description: 'Project name',
      required: true,
    }),
  };
  
  async run(): Promise<void> {
    const { args, flags } = await this.parse(Create);
    
    this.log(\`Creating project: \${args.name}\`);
    this.log(\`Template: \${flags.template}\`);
    
    if (flags['dry-run']) {
      this.log('Dry run - no files created');
      return;
    }
    
    // Create project...
    this.log('✓ Project created successfully!');
  }
}
\`\`\`

## YARGS (Alternative Parser)

\`\`\`typescript
#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

yargs(hideBin(process.argv))
  .command(
    'create <name>',
    'Create a new project',
    (yargs) => {
      return yargs
        .positional('name', {
          describe: 'Project name',
          type: 'string',
        })
        .option('template', {
          alias: 't',
          type: 'string',
          default: 'default',
        });
    },
    async (argv) => {
      console.log(\`Creating \${argv.name} with template \${argv.template}\`);
    }
  )
  .demandCommand(1)
  .strict()
  .help()
  .parse();
\`\`\`

## CONFIGURATION FILES

\`\`\`typescript
import { cosmiconfig } from 'cosmiconfig';
import { z } from 'zod';

const configSchema = z.object({
  template: z.string().default('default'),
  outputDir: z.string().default('./output'),
  plugins: z.array(z.string()).default([]),
});

async function loadConfig() {
  const explorer = cosmiconfig('mycli');
  const result = await explorer.search();
  
  if (result) {
    return configSchema.parse(result.config);
  }
  
  return configSchema.parse({});
}

// Supports: .myclirc, .myclirc.json, .myclirc.yaml, mycli.config.js
\`\`\`

## SIGNAL HANDLING

\`\`\`typescript
// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\nReceived SIGINT. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Cleaning up...');
  cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
\`\`\`

## TESTING CLI

\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('CLI', () => {
  it('should show help', () => {
    const output = execSync('node ./dist/index.js --help').toString();
    expect(output).toContain('Usage:');
    expect(output).toContain('Commands:');
  });
  
  it('should create project', () => {
    const output = execSync('node ./dist/index.js create test-app --dry-run').toString();
    expect(output).toContain('Creating project: test-app');
  });
  
  it('should fail with invalid args', () => {
    expect(() => {
      execSync('node ./dist/index.js create');
    }).toThrow();
  });
});
\`\`\`

## PUBLISHING TO NPM

\`\`\`json
{
  "name": "my-awesome-cli",
  "version": "1.0.0",
  "description": "My awesome CLI tool",
  "bin": {
    "my-cli": "./dist/index.js"
  },
  "files": ["dist"],
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["cli", "tool"],
  "repository": "github:user/my-cli",
  "license": "MIT"
}
\`\`\`

\`\`\`bash
# Publish
npm publish

# Install globally
npm install -g my-awesome-cli

# Or use with npx
npx my-awesome-cli create my-app
\`\`\`

## CHECKLIST

### Setup
- [ ] Shebang (#!/usr/bin/env node) no arquivo principal?
- [ ] bin configurado no package.json?
- [ ] TypeScript compilando para dist/?
- [ ] files array incluindo apenas dist/?

### UX
- [ ] Help text claro e completo?
- [ ] Exemplos de uso no help?
- [ ] Cores para feedback visual?
- [ ] Spinners para operações longas?
- [ ] Progress bars quando aplicável?

### Robustez
- [ ] Error handling graceful?
- [ ] Validação de inputs com mensagens claras?
- [ ] Signal handling (SIGINT, SIGTERM)?
- [ ] Exit codes corretos (0 sucesso, 1+ erro)?

### Qualidade
- [ ] Testes automatizados?
- [ ] Testado em diferentes shells (bash, zsh, PowerShell)?
- [ ] Documentação completa?
- [ ] Changelog mantido?

## ANTI-PATTERNS

❌ **NUNCA** ignore error handling - sempre trate erros
❌ **NUNCA** use console.log para tudo - use stderr para erros
❌ **NUNCA** bloqueie sem feedback - mostre spinners/progress
❌ **NUNCA** ignore sinais (SIGINT) - faça cleanup
❌ **NUNCA** use exit codes incorretos - 0 = sucesso
❌ **NUNCA** hardcode paths - use path.join()
❌ **NUNCA** assuma o OS - teste cross-platform
❌ **NUNCA** ignore encoding - use UTF-8 explicitamente
`;

export default CLI_DEVELOPMENT_MANIFEST;
