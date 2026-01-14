/**
 * 🏗️ TERRAFORM ADVANCED MANIFEST
 * 
 * Domínio: Infrastructure as Code avançado
 * Especialidade: Multi-cloud, modules, state management
 * 
 * @version 1.0.0
 * @author Micro-SaaS Factory
 */

export const TERRAFORM_ADVANCED_MANIFEST = {
  id: 'terraform-advanced',
  name: 'Terraform Advanced Master',
  version: '1.0.0',
  category: 'infrastructure-as-code',
  
  activation: {
    keywords: [
      'terraform', 'hcl', 'infrastructure as code', 'iac',
      'tfstate', 'terraform cloud', 'terragrunt', 'modules',
      'providers', 'workspaces', 'remote state', 'backend',
      'plan', 'apply', 'destroy', 'import', 'taint'
    ],
    patterns: [/terraform/i, /\.tf$/i, /tfstate/i, /terragrunt/i]
  },

  philosophy: {
    core: "Infrastructure should be versioned, reviewed, and deployed like application code.",
    principles: [
      "Immutable Infrastructure - Replace, don't modify",
      "State is Sacred - Protect and backup tfstate",
      "DRY with Modules - Reutilize, não copie",
      "Environment Parity - Dev = Staging = Prod (estrutura)",
      "Plan Before Apply - Sempre revise o plan",
      "Least Privilege - IAM mínimo para Terraform"
    ]
  },

  concepts: {
    stateManagement: {
      description: "Terraform state tracks real infrastructure",
      backends: ["S3 + DynamoDB", "Terraform Cloud", "Azure Blob", "GCS"],
      bestPractices: [
        "Remote state obrigatório para times",
        "State locking para evitar conflitos",
        "Encryption at rest",
        "Versionamento do state file"
      ]
    },
    modules: {
      description: "Reusable infrastructure components",
      types: ["Root module", "Child modules", "Published modules"],
      sources: ["Local paths", "Terraform Registry", "GitHub", "S3"]
    },
    workspaces: {
      description: "Multiple environments with same config",
      useCases: ["dev/staging/prod", "Multi-tenant", "Feature branches"],
      alternative: "Terragrunt para estrutura mais complexa"
    }
  },

  templates: {
    remoteBackend: `
# backend.tf - Remote State Configuration
terraform {
  backend "s3" {
    bucket         = "mycompany-terraform-state"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
`,
    moduleStructure: `
# modules/vpc/main.tf
variable "name" { type = string }
variable "cidr" { type = string }
variable "azs" { type = list(string) }

resource "aws_vpc" "main" {
  cidr_block           = var.cidr
  enable_dns_hostnames = true
  tags = { Name = var.name }
}

output "vpc_id" { value = aws_vpc.main.id }
`
  },

  antiPatterns: [
    "NUNCA commite tfstate no git",
    "NUNCA use local state em produção",
    "NUNCA faça apply sem plan",
    "NUNCA hardcode secrets em .tf files",
    "NUNCA ignore terraform fmt e validate"
  ]
};

export default TERRAFORM_ADVANCED_MANIFEST;
