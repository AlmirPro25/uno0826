/**
 * ⚡ GRPC MANIFEST
 * 
 * O Velocista dos Protocolos - Mestre Supremo de gRPC
 * Protocol Buffers, Streaming, Service Mesh, High Performance RPC
 * 
 * "REST é para humanos. gRPC é para máquinas.
 * Quando milissegundos importam, gRPC domina."
 */

export const GRPC_MANIFEST = {
  metadata: {
    id: 'grpc-master',
    name: 'gRPC Supreme Master',
    version: '1.0.0',
    description: 'Conhecimento completo sobre gRPC, Protocol Buffers, streaming, interceptors e service mesh',
    category: 'infrastructure-communication',
    level: 17,
    tags: ['grpc', 'protobuf', 'rpc', 'streaming', 'http2', 'microservices', 'service-mesh'],
    activationKeywords: [
      'grpc', 'g-rpc', 'protobuf', 'protocol buffers',
      'rpc', 'remote procedure call', 'service definition',
      'streaming', 'bidirectional', 'server streaming', 'client streaming',
      'http2', 'binary protocol', 'high performance',
      'interceptor', 'middleware', 'deadline', 'metadata',
      'service mesh', 'envoy', 'istio', 'linkerd'
    ]
  },

  philosophy: {
    core: 'gRPC é o padrão para comunicação entre serviços de alta performance.',
    principles: [
      'Contract-first com Protocol Buffers',
      'HTTP/2 para multiplexing e streaming',
      'Tipagem forte end-to-end',
      'Deadlines em TODAS as chamadas',
      'Interceptors para cross-cutting concerns',
      'Streaming para dados em tempo real'
    ],
    quotes: [
      '"gRPC: 10x faster than REST, 10x more type-safe."',
      '"Define once, generate everywhere."'
    ]
  },

  comparison: {
    vsRest: `
| Feature          | gRPC            | REST/JSON       |
|------------------|-----------------|-----------------|
| Protocol         | HTTP/2          | HTTP/1.1        |
| Payload          | Binary (Protobuf)| Text (JSON)    |
| Contract         | .proto files    | OpenAPI (opt)   |
| Streaming        | Native          | WebSocket/SSE   |
| Code Generation  | Built-in        | External tools  |
| Browser Support  | grpc-web        | Native          |
| Performance      | ~10x faster     | Baseline        |
| Human Readable   | No              | Yes             |
`,
    whenToUse: {
      grpc: [
        'Microservices internos',
        'Alta performance necessária',
        'Streaming bidirecional',
        'Polyglot (múltiplas linguagens)',
        'Mobile apps (bandwidth limitado)'
      ],
      rest: [
        'APIs públicas',
        'Browser clients',
        'Simplicidade > performance',
        'Debug fácil necessário',
        'Caching HTTP importante'
      ]
    }
  },

  protobuf: {
    description: 'Interface Definition Language (IDL) para definir serviços e mensagens',
    syntax: `
// user.proto
syntax = "proto3";

package user.v1;

option go_package = "github.com/myapp/proto/user/v1";

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

// Mensagem de usuário
message User {
  string id = 1;
  string email = 2;
  string name = 3;
  UserRole role = 4;
  google.protobuf.Timestamp created_at = 5;
  optional string avatar_url = 6;  // Campo opcional
  repeated string tags = 7;        // Array
  map<string, string> metadata = 8; // Map
}

enum UserRole {
  USER_ROLE_UNSPECIFIED = 0;
  USER_ROLE_ADMIN = 1;
  USER_ROLE_USER = 2;
  USER_ROLE_GUEST = 3;
}

// Request/Response messages
message GetUserRequest {
  string id = 1;
}

message GetUserResponse {
  User user = 1;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  string filter = 3;
}

message ListUsersResponse {
  repeated User users = 1;
  string next_page_token = 2;
  int32 total_count = 3;
}

message CreateUserRequest {
  string email = 1;
  string name = 2;
  string password = 3;
}

// Definição do serviço
service UserService {
  // Unary RPC
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(User) returns (User);
  rpc DeleteUser(GetUserRequest) returns (google.protobuf.Empty);
  
  // Server streaming
  rpc ListUsers(ListUsersRequest) returns (stream User);
  
  // Client streaming
  rpc BatchCreateUsers(stream CreateUserRequest) returns (ListUsersResponse);
  
  // Bidirectional streaming
  rpc Chat(stream ChatMessage) returns (stream ChatMessage);
}

message ChatMessage {
  string user_id = 1;
  string content = 2;
  google.protobuf.Timestamp timestamp = 3;
}
`,
    bestPractices: [
      'Use versionamento no package (v1, v2)',
      'Nunca remova ou renumere campos',
      'Use reserved para campos removidos',
      'Prefixe enums com o nome do tipo',
      'Use wrapper types para nullable primitives',
      'Documente com comentários'
    ],
    fieldRules: `
// Regras de numeração de campos
message Example {
  // 1-15: campos frequentes (1 byte)
  string id = 1;
  string name = 2;
  
  // 16-2047: campos menos frequentes (2 bytes)
  string description = 16;
  
  // Reservar campos removidos
  reserved 3, 4, 10 to 12;
  reserved "old_field", "deprecated_field";
}
`
  },

  communicationPatterns: {
    unary: {
      description: 'Request-Response simples (como REST)',
      useCase: 'CRUD operations, queries simples',
      example: `
// Server (Node.js)
const server = {
  getUser: async (call: ServerUnaryCall<GetUserRequest, GetUserResponse>, 
                  callback: sendUnaryData<GetUserResponse>) => {
    try {
      const user = await userService.findById(call.request.id);
      callback(null, { user });
    } catch (error) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: 'User not found'
      });
    }
  }
};

// Client
const response = await client.getUser({ id: '123' });
console.log(response.user);
`
    },
    serverStreaming: {
      description: 'Server envia múltiplas respostas para uma request',
      useCase: 'Download de arquivos, listagens grandes, real-time updates',
      example: `
// Server
const server = {
  listUsers: async (call: ServerWritableStream<ListUsersRequest, User>) => {
    const cursor = userService.createCursor(call.request);
    
    for await (const user of cursor) {
      call.write(user);
    }
    
    call.end();
  }
};

// Client
const stream = client.listUsers({ pageSize: 100 });

stream.on('data', (user: User) => {
  console.log('Received user:', user.name);
});

stream.on('end', () => {
  console.log('Stream ended');
});

stream.on('error', (err) => {
  console.error('Stream error:', err);
});
`
    },
    clientStreaming: {
      description: 'Client envia múltiplas requests, server responde uma vez',
      useCase: 'Upload de arquivos, batch operations, aggregations',
      example: `
// Server
const server = {
  batchCreateUsers: async (
    call: ServerReadableStream<CreateUserRequest, ListUsersResponse>,
    callback: sendUnaryData<ListUsersResponse>
  ) => {
    const users: User[] = [];
    
    call.on('data', async (request: CreateUserRequest) => {
      const user = await userService.create(request);
      users.push(user);
    });
    
    call.on('end', () => {
      callback(null, { users, totalCount: users.length });
    });
  }
};

// Client
const call = client.batchCreateUsers((err, response) => {
  if (err) throw err;
  console.log(\`Created \${response.totalCount} users\`);
});

for (const userData of usersToCreate) {
  call.write(userData);
}

call.end();
`
    },
    bidirectionalStreaming: {
      description: 'Ambos enviam streams independentes',
      useCase: 'Chat, gaming, real-time collaboration',
      example: `
// Server
const server = {
  chat: (call: ServerDuplexStream<ChatMessage, ChatMessage>) => {
    call.on('data', (message: ChatMessage) => {
      // Broadcast para outros clientes
      broadcastToRoom(message);
      
      // Echo ou resposta
      call.write({
        userId: 'server',
        content: \`Received: \${message.content}\`,
        timestamp: new Date()
      });
    });
    
    call.on('end', () => {
      call.end();
    });
  }
};

// Client
const call = client.chat();

call.on('data', (message: ChatMessage) => {
  console.log(\`[\${message.userId}]: \${message.content}\`);
});

// Enviar mensagens
call.write({ userId: 'user1', content: 'Hello!' });
call.write({ userId: 'user1', content: 'How are you?' });

// Fechar quando terminar
setTimeout(() => call.end(), 10000);
`
    }
  },

  nodeImplementation: {
    setup: `
// package.json dependencies
// "@grpc/grpc-js": "^1.9.0"
// "@grpc/proto-loader": "^0.7.0"
// "google-protobuf": "^3.21.0"

// Ou com nice-grpc (recomendado):
// "nice-grpc": "^2.1.0"
// "nice-grpc-server-reflection": "^2.0.0"
// "protobufjs": "^7.2.0"
`,
    serverWithNiceGrpc: `
import { createServer, createChannel, createClient } from 'nice-grpc';
import { UserServiceDefinition } from './generated/user';

// Implementação do serviço
const userServiceImpl: ServiceImplementation<typeof UserServiceDefinition> = {
  async getUser(request, context) {
    const user = await db.user.findUnique({ where: { id: request.id } });
    
    if (!user) {
      throw new ServerError(Status.NOT_FOUND, 'User not found');
    }
    
    return { user };
  },
  
  async *listUsers(request, context) {
    const users = await db.user.findMany({
      take: request.pageSize,
      skip: request.pageToken ? parseInt(request.pageToken) : 0
    });
    
    for (const user of users) {
      yield user;
    }
  },
  
  async createUser(request, context) {
    const user = await db.user.create({
      data: {
        email: request.email,
        name: request.name,
        passwordHash: await hash(request.password)
      }
    });
    
    return user;
  }
};

// Criar e iniciar servidor
const server = createServer();

server.add(UserServiceDefinition, userServiceImpl);

await server.listen('0.0.0.0:50051');
console.log('gRPC server running on port 50051');
`,
    clientWithNiceGrpc: `
import { createChannel, createClient } from 'nice-grpc';
import { UserServiceDefinition } from './generated/user';

// Criar canal e cliente
const channel = createChannel('localhost:50051');
const client = createClient(UserServiceDefinition, channel);

// Chamada unary
async function getUser(id: string) {
  try {
    const response = await client.getUser({ id });
    return response.user;
  } catch (error) {
    if (error instanceof ClientError) {
      if (error.code === Status.NOT_FOUND) {
        return null;
      }
    }
    throw error;
  }
}

// Server streaming
async function listAllUsers() {
  const users: User[] = [];
  
  for await (const user of client.listUsers({ pageSize: 100 })) {
    users.push(user);
  }
  
  return users;
}

// Com deadline
async function getUserWithTimeout(id: string) {
  const deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + 5);
  
  return client.getUser({ id }, { deadline });
}
`
  },

  goImplementation: {
    setup: `
// go.mod
// google.golang.org/grpc v1.59.0
// google.golang.org/protobuf v1.31.0

// Gerar código
// protoc --go_out=. --go-grpc_out=. proto/user.proto
`,
    server: `
package main

import (
    "context"
    "log"
    "net"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    
    pb "myapp/proto/user/v1"
)

type userServer struct {
    pb.UnimplementedUserServiceServer
    db *Database
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    user, err := s.db.FindUser(ctx, req.Id)
    if err != nil {
        return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
    }
    
    return &pb.GetUserResponse{User: user}, nil
}

func (s *userServer) ListUsers(req *pb.ListUsersRequest, stream pb.UserService_ListUsersServer) error {
    users, err := s.db.ListUsers(ctx, req.PageSize)
    if err != nil {
        return status.Errorf(codes.Internal, "failed to list users: %v", err)
    }
    
    for _, user := range users {
        if err := stream.Send(user); err != nil {
            return err
        }
    }
    
    return nil
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }
    
    s := grpc.NewServer(
        grpc.UnaryInterceptor(loggingInterceptor),
        grpc.StreamInterceptor(streamLoggingInterceptor),
    )
    
    pb.RegisterUserServiceServer(s, &userServer{db: NewDatabase()})
    
    log.Printf("gRPC server listening on :50051")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
`,
    client: `
package main

import (
    "context"
    "io"
    "log"
    "time"
    
    "google.golang.org/grpc"
    "google.golang.org/grpc/credentials/insecure"
    
    pb "myapp/proto/user/v1"
)

func main() {
    conn, err := grpc.Dial("localhost:50051", 
        grpc.WithTransportCredentials(insecure.NewCredentials()),
    )
    if err != nil {
        log.Fatalf("failed to connect: %v", err)
    }
    defer conn.Close()
    
    client := pb.NewUserServiceClient(conn)
    
    // Unary call with timeout
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    resp, err := client.GetUser(ctx, &pb.GetUserRequest{Id: "123"})
    if err != nil {
        log.Fatalf("GetUser failed: %v", err)
    }
    log.Printf("User: %v", resp.User)
    
    // Server streaming
    stream, err := client.ListUsers(ctx, &pb.ListUsersRequest{PageSize: 100})
    if err != nil {
        log.Fatalf("ListUsers failed: %v", err)
    }
    
    for {
        user, err := stream.Recv()
        if err == io.EOF {
            break
        }
        if err != nil {
            log.Fatalf("stream error: %v", err)
        }
        log.Printf("Received user: %v", user.Name)
    }
}
`
  },

  interceptors: {
    description: 'Middleware para gRPC - logging, auth, metrics, etc.',
    unaryServer: `
// Logging interceptor
func loggingInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    start := time.Now()
    
    // Chamar handler
    resp, err := handler(ctx, req)
    
    // Log
    log.Printf(
        "method=%s duration=%s error=%v",
        info.FullMethod,
        time.Since(start),
        err,
    )
    
    return resp, err
}

// Auth interceptor
func authInterceptor(
    ctx context.Context,
    req interface{},
    info *grpc.UnaryServerInfo,
    handler grpc.UnaryHandler,
) (interface{}, error) {
    md, ok := metadata.FromIncomingContext(ctx)
    if !ok {
        return nil, status.Error(codes.Unauthenticated, "missing metadata")
    }
    
    tokens := md.Get("authorization")
    if len(tokens) == 0 {
        return nil, status.Error(codes.Unauthenticated, "missing token")
    }
    
    user, err := validateToken(tokens[0])
    if err != nil {
        return nil, status.Error(codes.Unauthenticated, "invalid token")
    }
    
    // Adicionar user ao context
    ctx = context.WithValue(ctx, "user", user)
    
    return handler(ctx, req)
}

// Combinar interceptors
server := grpc.NewServer(
    grpc.ChainUnaryInterceptor(
        loggingInterceptor,
        authInterceptor,
        metricsInterceptor,
    ),
)
`,
    unaryClient: `
// Client interceptor (Node.js com nice-grpc)
import { createClientFactory, ClientMiddleware } from 'nice-grpc';

const loggingMiddleware: ClientMiddleware = async function* (call, options) {
  const start = Date.now();
  
  try {
    const result = yield* call.next(call.request, options);
    
    console.log({
      method: call.method.path,
      duration: Date.now() - start,
      success: true
    });
    
    return result;
  } catch (error) {
    console.log({
      method: call.method.path,
      duration: Date.now() - start,
      success: false,
      error: error.message
    });
    throw error;
  }
};

const retryMiddleware: ClientMiddleware = async function* (call, options) {
  const maxRetries = 3;
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return yield* call.next(call.request, options);
    } catch (error) {
      lastError = error;
      
      if (!isRetryable(error)) {
        throw error;
      }
      
      await sleep(Math.pow(2, attempt) * 100);
    }
  }
  
  throw lastError;
};

const clientFactory = createClientFactory()
  .use(loggingMiddleware)
  .use(retryMiddleware);

const client = clientFactory.create(UserServiceDefinition, channel);
`
  },

  errorHandling: {
    statusCodes: `
// gRPC Status Codes
| Code | Name              | HTTP | Use Case                    |
|------|-------------------|------|-----------------------------|
| 0    | OK                | 200  | Success                     |
| 1    | CANCELLED         | 499  | Client cancelled            |
| 2    | UNKNOWN           | 500  | Unknown error               |
| 3    | INVALID_ARGUMENT  | 400  | Bad request                 |
| 4    | DEADLINE_EXCEEDED | 504  | Timeout                     |
| 5    | NOT_FOUND         | 404  | Resource not found          |
| 6    | ALREADY_EXISTS    | 409  | Conflict                    |
| 7    | PERMISSION_DENIED | 403  | Forbidden                   |
| 8    | RESOURCE_EXHAUSTED| 429  | Rate limited                |
| 9    | FAILED_PRECONDITION| 400 | State invalid               |
| 10   | ABORTED           | 409  | Concurrency conflict        |
| 11   | OUT_OF_RANGE      | 400  | Invalid range               |
| 12   | UNIMPLEMENTED     | 501  | Not implemented             |
| 13   | INTERNAL          | 500  | Internal error              |
| 14   | UNAVAILABLE       | 503  | Service unavailable         |
| 15   | DATA_LOSS         | 500  | Unrecoverable data loss     |
| 16   | UNAUTHENTICATED   | 401  | Not authenticated           |
`,
    richErrors: `
// Erros detalhados com google.rpc.Status
import { Status } from '@grpc/grpc-js/build/src/constants';

// Server
throw new ServerError(
  Status.INVALID_ARGUMENT,
  'Validation failed',
  [
    {
      '@type': 'type.googleapis.com/google.rpc.BadRequest',
      fieldViolations: [
        { field: 'email', description: 'Invalid email format' },
        { field: 'name', description: 'Name is required' }
      ]
    }
  ]
);

// Client
try {
  await client.createUser(request);
} catch (error) {
  if (error instanceof ClientError) {
    console.log('Code:', error.code);
    console.log('Message:', error.message);
    console.log('Details:', error.details);
  }
}
`
  },

  loadBalancing: {
    clientSide: `
// gRPC suporta load balancing client-side
const channel = createChannel('dns:///my-service:50051', {
  // Round-robin entre endpoints
  'grpc.service_config': JSON.stringify({
    loadBalancingConfig: [{ round_robin: {} }]
  })
});
`,
    serviceMesh: `
// Com Envoy/Istio, o load balancing é transparente
// O sidecar proxy intercepta todas as chamadas

// Kubernetes Service
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  ports:
    - port: 50051
      targetPort: 50051
      protocol: TCP
  selector:
    app: user-service

// Istio VirtualService para traffic management
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: user-service
spec:
  hosts:
    - user-service
  http:
    - route:
        - destination:
            host: user-service
            subset: v1
          weight: 90
        - destination:
            host: user-service
            subset: v2
          weight: 10
`
  },

  security: {
    tls: `
// Server com TLS
const credentials = grpc.ServerCredentials.createSsl(
  fs.readFileSync('ca.crt'),
  [{
    cert_chain: fs.readFileSync('server.crt'),
    private_key: fs.readFileSync('server.key')
  }],
  true // Require client cert (mTLS)
);

server.bindAsync('0.0.0.0:50051', credentials, () => {
  server.start();
});

// Client com TLS
const credentials = grpc.credentials.createSsl(
  fs.readFileSync('ca.crt'),
  fs.readFileSync('client.key'),
  fs.readFileSync('client.crt')
);

const channel = createChannel('my-service:50051', credentials);
`,
    tokenAuth: `
// Adicionar token via metadata
const client = createClient(UserServiceDefinition, channel);

const response = await client.getUser(
  { id: '123' },
  {
    metadata: Metadata({
      authorization: \`Bearer \${token}\`
    })
  }
);
`
  },

  bestPractices: [
    'SEMPRE defina deadlines nas chamadas',
    'Use streaming para dados grandes ou real-time',
    'Implemente health checks (grpc.health.v1)',
    'Use reflection para debugging',
    'Versione seus protos (v1, v2)',
    'Gere código para todas as linguagens necessárias',
    'Implemente retry com backoff exponencial',
    'Use interceptors para cross-cutting concerns',
    'Monitore latência e error rate',
    'Documente seus serviços'
  ],

  antiPatterns: [
    'Chamadas sem deadline (podem travar forever)',
    'Mensagens muito grandes (>4MB default)',
    'Não tratar erros específicos',
    'Ignorar backpressure em streaming',
    'Não usar connection pooling',
    'Misturar versões de proto incompatíveis',
    'Não implementar graceful shutdown'
  ],

  checklist: {
    design: [
      'Protos versionados?',
      'Mensagens bem definidas?',
      'Streaming onde apropriado?',
      'Error codes corretos?'
    ],
    implementation: [
      'Deadlines em todas as chamadas?',
      'Interceptors para logging/auth?',
      'Health check implementado?',
      'Graceful shutdown?'
    ],
    operations: [
      'TLS configurado?',
      'Métricas expostas?',
      'Load balancing configurado?',
      'Reflection habilitado (dev)?'
    ]
  }
};

export default GRPC_MANIFEST;
