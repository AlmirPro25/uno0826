/**
 * 📚 STORYBOOK DESIGN SYSTEM MANIFEST
 * 
 * Domínio: Component documentation e Design Systems
 * Especialidade: Storybook, Component-driven development
 * 
 * @version 1.0.0
 * @author Micro-SaaS Factory
 */

export const STORYBOOK_DESIGN_SYSTEM_MANIFEST = {
  id: 'storybook-design-system',
  name: 'Storybook Design System Master',
  version: '1.0.0',
  category: 'frontend-tooling',
  
  activation: {
    keywords: [
      'storybook', 'design system', 'component library',
      'ui documentation', 'visual testing', 'chromatic',
      'mdx', 'stories', 'addons', 'controls', 'actions',
      'atomic design', 'tokens', 'figma integration'
    ],
    patterns: [/storybook/i, /design\s*system/i, /\.stories\./i]
  },

  philosophy: {
    core: "Build components in isolation. Document as you build. Test visually.",
    principles: [
      "Component-Driven Development - Bottom-up",
      "Single Source of Truth - Storybook IS the documentation",
      "Visual Testing - Catch regressions visually",
      "Accessibility First - Test a11y in stories",
      "Design Tokens - Systematic design decisions"
    ]
  },

  templates: {
    buttonStory: `
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost']
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'lg']
    },
    onClick: { action: 'clicked' }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Click me'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary'
  }
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  )
};
`,
    designTokens: `
// tokens.ts
export const tokens = {
  colors: {
    primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
    gray: { 50: '#f9fafb', 500: '#6b7280', 900: '#111827' }
  },
  spacing: { xs: '0.25rem', sm: '0.5rem', md: '1rem', lg: '1.5rem' },
  radii: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
  fonts: { sans: 'Inter, sans-serif', mono: 'JetBrains Mono, monospace' }
};
`
  },

  addons: [
    "@storybook/addon-essentials - Controls, Actions, Docs",
    "@storybook/addon-a11y - Accessibility testing",
    "@storybook/addon-interactions - Play functions",
    "chromatic - Visual regression testing",
    "@storybook/addon-designs - Figma integration"
  ],

  bestPractices: [
    "Uma story por estado do componente",
    "Use args para props dinâmicas",
    "Documente com MDX para contexto",
    "Teste interações com play functions",
    "Integre com Chromatic para visual testing"
  ],

  antiPatterns: [
    "NUNCA crie componentes sem stories",
    "NUNCA ignore acessibilidade",
    "NUNCA duplique código entre stories",
    "NUNCA deixe stories desatualizadas"
  ]
};

export default STORYBOOK_DESIGN_SYSTEM_MANIFEST;
