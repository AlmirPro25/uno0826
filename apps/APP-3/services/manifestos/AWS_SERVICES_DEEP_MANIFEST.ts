/**
 * ☁️ AWS SERVICES DEEP MANIFEST
 * 
 * Domínio: Amazon Web Services - Serviços Avançados
 * Especialidade: Arquitetura cloud enterprise-grade
 * 
 * @version 1.0.0
 * @author Micro-SaaS Factory
 */

export const AWS_SERVICES_DEEP_MANIFEST = {
  id: 'aws-services-deep',
  name: 'AWS Services Deep Master',
  version: '1.0.0',
  category: 'cloud-infrastructure',
  
  activation: {
    keywords: [
      'aws', 'amazon web services', 'ec2', 's3', 'lambda',
      'dynamodb', 'rds', 'aurora', 'elasticache', 'sqs', 'sns',
      'api gateway', 'cloudfront', 'route53', 'ecs', 'eks',
      'fargate', 'step functions', 'eventbridge', 'kinesis',
      'cognito', 'iam', 'vpc', 'cloudwatch', 'cloudformation',
      'cdk', 'sam', 'amplify', 'app runner', 'lightsail'
    ],
    patterns: [
      /aws/i, /amazon\s*web/i, /ec2/i, /s3\s*bucket/i,
      /lambda\s*function/i, /dynamodb/i, /cloudfront/i
    ]
  },

  philosophy: {
    core: "Build on AWS like you're building for millions, even if you're starting with one.",
    principles: [
      "Well-Architected Framework - 6 pilares sempre",
      "Least Privilege - IAM mínimo necessário",
      "Infrastructure as Code - Tudo versionado",
      "Cost Optimization - Pay for what you use",
      "Security by Design - Não é afterthought",
      "Resilience First - Design for failure"
    ]
  },

  wellArchitectedPillars: {
    operationalExcellence: {
      description: "Executar e monitorar sistemas",
      practices: [
        "Infrastructure as Code (CDK/CloudFormation)",
        "Observability (CloudWatch, X-Ray)",
        "Runbooks e playbooks documentados",
        "Automação de operações"
      ]
    },
    security: {
      description: "Proteger informações e sistemas",
      practices: [
        "IAM com least privilege",
        "Encryption at rest e in transit",
        "Security groups e NACLs",
        "AWS Config e GuardDuty"
      ]
    },
    reliability: {
      description: "Recuperar de falhas",
      practices: [
        "Multi-AZ deployments",
        "Auto Scaling",
        "Backup e disaster recovery",
        "Health checks e circuit breakers"
      ]
    },
    performanceEfficiency: {
      description: "Usar recursos eficientemente",
      practices: [
        "Right-sizing de instâncias",
        "Caching (ElastiCache, CloudFront)",
        "Serverless quando apropriado",
        "Database optimization"
      ]
    },
    costOptimization: {
      description: "Evitar gastos desnecessários",
      practices: [
        "Reserved Instances / Savings Plans",
        "Spot Instances para workloads tolerantes",
        "S3 lifecycle policies",
        "Cost Explorer e Budgets"
      ]
    },
    sustainability: {
      description: "Minimizar impacto ambiental",
      practices: [
        "Escolher regiões com energia limpa",
        "Right-sizing contínuo",
        "Serverless para eficiência",
        "Data lifecycle management"
      ]
    }
  },

  services: {
    compute: {
      ec2: {
        description: "Virtual servers",
        useCases: ["Web servers", "Batch processing", "Legacy apps"],
        instanceTypes: {
          general: ["t3", "t3a", "m6i", "m6a"],
          compute: ["c6i", "c6a", "c7g"],
          memory: ["r6i", "r6a", "x2idn"],
          storage: ["i3", "d3", "h1"],
          accelerated: ["p4d", "g5", "inf2"]
        }
      },
      lambda: {
        description: "Serverless functions",
        useCases: ["APIs", "Event processing", "Scheduled tasks"],
        limits: {
          timeout: "15 minutes",
          memory: "128MB - 10GB",
          payload: "6MB sync, 256KB async",
          concurrency: "1000 default (adjustable)"
        }
      },
      ecs: {
        description: "Container orchestration",
        launchTypes: ["EC2", "Fargate"],
        useCases: ["Microservices", "Batch jobs", "ML inference"]
      },
      eks: {
        description: "Managed Kubernetes",
        useCases: ["K8s workloads", "Multi-cloud strategy"]
      }
    },
    storage: {
      s3: {
        description: "Object storage",
        storageClasses: [
          { name: "Standard", use: "Frequent access" },
          { name: "Intelligent-Tiering", use: "Unknown patterns" },
          { name: "Standard-IA", use: "Infrequent access" },
          { name: "Glacier", use: "Archive (minutes)" },
          { name: "Glacier Deep Archive", use: "Archive (hours)" }
        ]
      },
      ebs: {
        description: "Block storage for EC2",
        types: ["gp3", "io2", "st1", "sc1"]
      },
      efs: {
        description: "Managed NFS",
        useCases: ["Shared file systems", "Container storage"]
      }
    },
    database: {
      rds: {
        description: "Managed relational DB",
        engines: ["PostgreSQL", "MySQL", "MariaDB", "Oracle", "SQL Server"],
        features: ["Multi-AZ", "Read Replicas", "Automated backups"]
      },
      aurora: {
        description: "Cloud-native relational DB",
        features: ["5x MySQL performance", "3x PostgreSQL", "Serverless v2"]
      },
      dynamodb: {
        description: "Serverless NoSQL",
        features: ["Single-digit ms latency", "Auto scaling", "Global tables"]
      },
      elasticache: {
        description: "Managed Redis/Memcached",
        useCases: ["Session store", "Caching", "Real-time analytics"]
      }
    },
    networking: {
      vpc: {
        description: "Virtual private cloud",
        components: ["Subnets", "Route tables", "NAT Gateway", "Internet Gateway"]
      },
      cloudfront: {
        description: "CDN",
        features: ["Edge locations", "Lambda@Edge", "Origin Shield"]
      },
      route53: {
        description: "DNS service",
        features: ["Health checks", "Routing policies", "Domain registration"]
      },
      apiGateway: {
        description: "API management",
        types: ["REST", "HTTP", "WebSocket"]
      }
    },
    integration: {
      sqs: {
        description: "Message queue",
        types: ["Standard", "FIFO"],
        features: ["Dead letter queues", "Long polling", "Visibility timeout"]
      },
      sns: {
        description: "Pub/sub messaging",
        features: ["Fan-out", "Mobile push", "SMS"]
      },
      eventbridge: {
        description: "Event bus",
        features: ["Event patterns", "Scheduling", "SaaS integrations"]
      },
      stepFunctions: {
        description: "Workflow orchestration",
        features: ["Visual workflows", "Error handling", "Parallel execution"]
      }
    },
    security: {
      iam: {
        description: "Identity and access management",
        components: ["Users", "Roles", "Policies", "Groups"]
      },
      cognito: {
        description: "User authentication",
        features: ["User pools", "Identity pools", "Social login"]
      },
      secretsManager: {
        description: "Secrets management",
        features: ["Rotation", "Cross-account", "RDS integration"]
      },
      kms: {
        description: "Key management",
        features: ["CMKs", "Envelope encryption", "Key rotation"]
      }
    }
  },

  templates: {
    cdkStack: `
// lib/main-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class MainStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'MainVPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        { name: 'Public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED, cidrMask: 24 }
      ]
    });

    // RDS PostgreSQL
    const database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      multiAz: false, // true for production
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY // SNAPSHOT for production
    });

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'AssetsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          transitions: [
            { storageClass: s3.StorageClass.INFREQUENT_ACCESS, transitionAfter: cdk.Duration.days(30) },
            { storageClass: s3.StorageClass.GLACIER, transitionAfter: cdk.Duration.days(90) }
          ]
        }
      ]
    });

    // SQS Queue
    const dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(14)
    });

    const queue = new sqs.Queue(this, 'MainQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      deadLetterQueue: {
        queue: dlq,
        maxReceiveCount: 3
      }
    });

    // Lambda Function
    const fn = new lambda.Function(this, 'ApiHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        DATABASE_SECRET_ARN: database.secret?.secretArn || '',
        BUCKET_NAME: bucket.bucketName,
        QUEUE_URL: queue.queueUrl
      },
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256
    });

    // Grant permissions
    database.secret?.grantRead(fn);
    bucket.grantReadWrite(fn);
    queue.grantSendMessages(fn);

    // API Gateway
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'Main API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000
      }
    });

    const integration = new apigateway.LambdaIntegration(fn);
    api.root.addMethod('ANY', integration);
    api.root.addProxy({ defaultIntegration: integration });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url });
    new cdk.CfnOutput(this, 'BucketName', { value: bucket.bucketName });
  }
}
`,

    lambdaHandler: `
// lambda/index.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

// Initialize clients outside handler for connection reuse
const secretsManager = new SecretsManager({});
const s3 = new S3Client({});
const sqs = new SQSClient({});
const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Cache secrets
let dbCredentials: { username: string; password: string; host: string } | null = null;

async function getDbCredentials() {
  if (dbCredentials) return dbCredentials;
  
  const secret = await secretsManager.getSecretValue({
    SecretId: process.env.DATABASE_SECRET_ARN
  });
  
  dbCredentials = JSON.parse(secret.SecretString!);
  return dbCredentials;
}

export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  // Don't wait for event loop to be empty
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const { httpMethod, path, body, pathParameters, queryStringParameters } = event;

    // Route handling
    if (path === '/health') {
      return response(200, { status: 'healthy', region: process.env.AWS_REGION });
    }

    if (path.startsWith('/items')) {
      return handleItems(httpMethod, pathParameters, body, queryStringParameters);
    }

    if (path.startsWith('/upload')) {
      return handleUpload(httpMethod, body);
    }

    if (path.startsWith('/queue')) {
      return handleQueue(httpMethod, body);
    }

    return response(404, { error: 'Not found' });

  } catch (error: any) {
    console.error('Handler error:', error);
    return response(500, { error: error.message });
  }
}

async function handleItems(
  method: string,
  params: any,
  body: string | null,
  query: any
): Promise<APIGatewayProxyResult> {
  const tableName = process.env.DYNAMODB_TABLE!;

  switch (method) {
    case 'GET':
      if (params?.id) {
        const result = await dynamodb.send(new GetCommand({
          TableName: tableName,
          Key: { id: params.id }
        }));
        return response(200, result.Item || {});
      }
      
      // Query with GSI
      const queryResult = await dynamodb.send(new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'gsi1pk = :pk',
        ExpressionAttributeValues: { ':pk': query?.type || 'default' },
        Limit: parseInt(query?.limit) || 20
      }));
      return response(200, { items: queryResult.Items });

    case 'POST':
      const item = JSON.parse(body!);
      item.id = item.id || crypto.randomUUID();
      item.createdAt = new Date().toISOString();
      
      await dynamodb.send(new PutCommand({
        TableName: tableName,
        Item: item
      }));
      return response(201, item);

    default:
      return response(405, { error: 'Method not allowed' });
  }
}

async function handleUpload(method: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (method !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const { filename, content, contentType } = JSON.parse(body!);
  const key = \`uploads/\${Date.now()}-\${filename}\`;

  await s3.send(new PutObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
    Body: Buffer.from(content, 'base64'),
    ContentType: contentType
  }));

  return response(200, { key, url: \`s3://\${process.env.BUCKET_NAME}/\${key}\` });
}

async function handleQueue(method: string, body: string | null): Promise<APIGatewayProxyResult> {
  if (method !== 'POST') {
    return response(405, { error: 'Method not allowed' });
  }

  const message = JSON.parse(body!);
  
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.QUEUE_URL,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      Type: { DataType: 'String', StringValue: message.type || 'default' }
    }
  }));

  return response(200, { queued: true });
}

function response(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}
`,

    stepFunctionsWorkflow: `
// lib/workflow-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class WorkflowStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda functions for each step
    const validateFn = new lambda.Function(this, 'ValidateFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'validate.handler',
      code: lambda.Code.fromAsset('lambda/workflow')
    });

    const processFn = new lambda.Function(this, 'ProcessFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'process.handler',
      code: lambda.Code.fromAsset('lambda/workflow'),
      timeout: cdk.Duration.minutes(5)
    });

    const notifyFn = new lambda.Function(this, 'NotifyFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'notify.handler',
      code: lambda.Code.fromAsset('lambda/workflow')
    });

    // Step Functions tasks
    const validateTask = new tasks.LambdaInvoke(this, 'Validate', {
      lambdaFunction: validateFn,
      outputPath: '$.Payload'
    });

    const processTask = new tasks.LambdaInvoke(this, 'Process', {
      lambdaFunction: processFn,
      outputPath: '$.Payload'
    });

    const notifySuccessTask = new tasks.LambdaInvoke(this, 'NotifySuccess', {
      lambdaFunction: notifyFn,
      payload: sfn.TaskInput.fromObject({
        status: 'SUCCESS',
        data: sfn.JsonPath.entirePayload
      })
    });

    const notifyFailureTask = new tasks.LambdaInvoke(this, 'NotifyFailure', {
      lambdaFunction: notifyFn,
      payload: sfn.TaskInput.fromObject({
        status: 'FAILURE',
        error: sfn.JsonPath.stringAt('$.error')
      })
    });

    // Parallel processing
    const parallelProcess = new sfn.Parallel(this, 'ParallelProcess')
      .branch(
        new tasks.LambdaInvoke(this, 'ProcessA', {
          lambdaFunction: processFn,
          payload: sfn.TaskInput.fromObject({ type: 'A', data: sfn.JsonPath.entirePayload })
        })
      )
      .branch(
        new tasks.LambdaInvoke(this, 'ProcessB', {
          lambdaFunction: processFn,
          payload: sfn.TaskInput.fromObject({ type: 'B', data: sfn.JsonPath.entirePayload })
        })
      );

    // Choice state
    const checkValidation = new sfn.Choice(this, 'IsValid?')
      .when(sfn.Condition.booleanEquals('$.valid', true), processTask)
      .otherwise(notifyFailureTask);

    // Define workflow
    const definition = validateTask
      .next(checkValidation);

    processTask
      .addCatch(notifyFailureTask, { resultPath: '$.error' })
      .next(parallelProcess)
      .next(notifySuccessTask);

    // State Machine
    const stateMachine = new sfn.StateMachine(this, 'OrderWorkflow', {
      definition,
      timeout: cdk.Duration.minutes(30),
      tracingEnabled: true
    });

    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn
    });
  }
}
`,

    eventBridgeRules: `
// lib/events-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export class EventsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Custom Event Bus
    const eventBus = new events.EventBus(this, 'AppEventBus', {
      eventBusName: 'app-events'
    });

    // Lambda handler
    const eventHandler = new lambda.Function(this, 'EventHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'events.handler',
      code: lambda.Code.fromAsset('lambda')
    });

    // SQS for async processing
    const eventQueue = new sqs.Queue(this, 'EventQueue');

    // SNS for fan-out
    const alertTopic = new sns.Topic(this, 'AlertTopic');

    // Rule: Order Created
    new events.Rule(this, 'OrderCreatedRule', {
      eventBus,
      eventPattern: {
        source: ['app.orders'],
        detailType: ['OrderCreated']
      },
      targets: [
        new targets.LambdaFunction(eventHandler),
        new targets.SqsQueue(eventQueue)
      ]
    });

    // Rule: Payment Failed
    new events.Rule(this, 'PaymentFailedRule', {
      eventBus,
      eventPattern: {
        source: ['app.payments'],
        detailType: ['PaymentFailed'],
        detail: {
          amount: [{ numeric: ['>', 1000] }]
        }
      },
      targets: [
        new targets.SnsTopic(alertTopic)
      ]
    });

    // Scheduled Rule (Cron)
    new events.Rule(this, 'DailyCleanupRule', {
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '3',
        day: '*',
        month: '*',
        year: '*'
      }),
      targets: [
        new targets.LambdaFunction(eventHandler, {
          event: events.RuleTargetInput.fromObject({
            action: 'cleanup',
            timestamp: events.EventField.time
          })
        })
      ]
    });

    // Archive for replay
    new events.Archive(this, 'EventArchive', {
      sourceEventBus: eventBus,
      eventPattern: { source: [{ prefix: 'app.' }] },
      retention: cdk.Duration.days(30)
    });
  }
}
`
  },

  costOptimization: {
    compute: [
      "Use Spot Instances para workloads tolerantes (até 90% desconto)",
      "Reserved Instances para workloads previsíveis (até 72% desconto)",
      "Savings Plans para flexibilidade",
      "Right-size instances com Compute Optimizer",
      "Use Graviton (ARM) para melhor price/performance"
    ],
    storage: [
      "S3 Intelligent-Tiering para padrões desconhecidos",
      "Lifecycle policies para arquivamento automático",
      "Delete snapshots não utilizados",
      "Use S3 Select para queries parciais"
    ],
    database: [
      "Aurora Serverless v2 para workloads variáveis",
      "Reserved Instances para RDS",
      "DynamoDB On-Demand para tráfego imprevisível",
      "ElastiCache Reserved Nodes"
    ],
    networking: [
      "Use VPC Endpoints para tráfego interno",
      "CloudFront para reduzir data transfer",
      "NAT Gateway vs NAT Instance (custo vs gerenciamento)"
    ]
  },

  antiPatterns: [
    "NUNCA use root account para operações diárias",
    "NUNCA deixe buckets S3 públicos sem necessidade",
    "NUNCA hardcode credentials no código",
    "NUNCA ignore CloudTrail e logging",
    "NUNCA use security groups com 0.0.0.0/0 para SSH",
    "NUNCA deixe recursos sem tags",
    "NUNCA ignore limites de serviço (quotas)"
  ],

  checklist: {
    security: [
      "MFA habilitado para root e IAM users?",
      "IAM policies seguem least privilege?",
      "Encryption at rest habilitado?",
      "VPC flow logs ativos?",
      "CloudTrail habilitado em todas as regiões?",
      "GuardDuty ativo?"
    ],
    reliability: [
      "Multi-AZ para databases?",
      "Auto Scaling configurado?",
      "Backups automatizados?",
      "Health checks configurados?",
      "Disaster recovery testado?"
    ],
    cost: [
      "Budgets e alertas configurados?",
      "Cost Explorer revisado mensalmente?",
      "Recursos não utilizados identificados?",
      "Reserved Instances/Savings Plans avaliados?",
      "Tags de cost allocation aplicadas?"
    ]
  }
};

export default AWS_SERVICES_DEEP_MANIFEST;
