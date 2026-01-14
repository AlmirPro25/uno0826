/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                                                                              ║
 * ║  🔮 GRAPHQL SUPREME MASTER - O ARQUITETO DE APIS FLEXÍVEIS                  ║
 * ║                                                                              ║
 * ║  "Uma query para governar todas, uma query para encontrá-las"               ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

export const GRAPHQL_SUPREME_MANIFEST = `
# 🔮 GRAPHQL SUPREME MASTER

## ATIVAÇÃO
Este manifesto é ativado quando o usuário menciona:
- GraphQL, GQL, query, mutation, subscription
- Apollo, Apollo Server, Apollo Client
- Hasura, Pothos, GraphQL Yoga, Nexus
- Schema, resolver, type definitions
- Federation, Gateway, Subgraph
- DataLoader, N+1, batching
- Introspection, SDL, codegen

## FILOSOFIA
> "Peça exatamente o que precisa. Nada mais, nada menos."

### Princípios Invioláveis
1. **Schema First** - O schema é o contrato
2. **Single Endpoint** - Uma URL, infinitas possibilidades
3. **Type Safety** - Tipos fortes end-to-end
4. **No Over-fetching** - Cliente decide o que quer
5. **No Under-fetching** - Tudo em uma request
6. **Introspection** - API auto-documentada

## ARQUITETURA

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    GRAPHQL ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLIENT                                                         │
│  [Apollo Client] [urql] [graphql-request]                       │
│         │                                                       │
│         ▼                                                       │
│  GATEWAY (Optional)                                             │
│  [Apollo Gateway] [GraphQL Mesh]                                │
│         │                                                       │
│         ▼                                                       │
│  SERVER                                                         │
│  [Apollo Server] [GraphQL Yoga] [Hasura]                        │
│         │                                                       │
│         ▼                                                       │
│  RESOLVERS + DATALOADERS                                        │
│         │                                                       │
│         ▼                                                       │
│  DATA SOURCES                                                   │
│  [Database] [REST APIs] [Microservices]                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## SCHEMA DESIGN

### Type Definitions (SDL)
\`\`\`graphql
# schema.graphql
type User {
  id: ID!
  email: String!
  name: String!
  posts: [Post!]!
  createdAt: DateTime!
}

type Post {
  id: ID!
  title: String!
  content: String!
  author: User!
  comments: [Comment!]!
  published: Boolean!
  createdAt: DateTime!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}

type Query {
  user(id: ID!): User
  users(limit: Int, offset: Int): [User!]!
  post(id: ID!): Post
  posts(published: Boolean): [Post!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
  
  createPost(input: CreatePostInput!): Post!
  publishPost(id: ID!): Post!
}

type Subscription {
  postCreated: Post!
  commentAdded(postId: ID!): Comment!
}

input CreateUserInput {
  email: String!
  name: String!
  password: String!
}

input UpdateUserInput {
  email: String
  name: String
}

input CreatePostInput {
  title: String!
  content: String!
}

scalar DateTime
\`\`\`

## APOLLO SERVER (Node.js)

\`\`\`typescript
// server.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { createContext } from './context';

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
  plugins: [
    // Logging
    {
      async requestDidStart() {
        return {
          async didEncounterErrors({ errors }) {
            errors.forEach(err => console.error(err));
          },
        };
      },
    },
  ],
});

await server.start();

app.use(
  '/graphql',
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: createContext,
  })
);
\`\`\`

### Resolvers
\`\`\`typescript
// resolvers.ts
import { Resolvers } from './generated/graphql';
import { Context } from './context';

export const resolvers: Resolvers<Context> = {
  Query: {
    user: async (_, { id }, { dataSources }) => {
      return dataSources.userAPI.getUser(id);
    },
    users: async (_, { limit, offset }, { dataSources }) => {
      return dataSources.userAPI.getUsers({ limit, offset });
    },
    post: async (_, { id }, { dataSources }) => {
      return dataSources.postAPI.getPost(id);
    },
  },
  
  Mutation: {
    createUser: async (_, { input }, { dataSources }) => {
      return dataSources.userAPI.createUser(input);
    },
    createPost: async (_, { input }, { dataSources, user }) => {
      if (!user) throw new AuthenticationError('Must be logged in');
      return dataSources.postAPI.createPost({ ...input, authorId: user.id });
    },
  },
  
  // Field resolvers
  User: {
    posts: async (parent, _, { dataSources }) => {
      return dataSources.postAPI.getPostsByAuthor(parent.id);
    },
  },
  
  Post: {
    author: async (parent, _, { loaders }) => {
      // Using DataLoader to batch requests
      return loaders.userLoader.load(parent.authorId);
    },
  },
  
  Subscription: {
    postCreated: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(['POST_CREATED']),
    },
  },
};
\`\`\`

### DataLoader (N+1 Solution)
\`\`\`typescript
// loaders.ts
import DataLoader from 'dataloader';

export const createLoaders = (dataSources: DataSources) => ({
  userLoader: new DataLoader<string, User>(async (ids) => {
    const users = await dataSources.userAPI.getUsersByIds(ids as string[]);
    // Maintain order
    const userMap = new Map(users.map(u => [u.id, u]));
    return ids.map(id => userMap.get(id) || null);
  }),
  
  postLoader: new DataLoader<string, Post>(async (ids) => {
    const posts = await dataSources.postAPI.getPostsByIds(ids as string[]);
    const postMap = new Map(posts.map(p => [p.id, p]));
    return ids.map(id => postMap.get(id) || null);
  }),
});
\`\`\`

## APOLLO CLIENT (React)

\`\`\`typescript
// apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpLink = createHttpLink({
  uri: '/graphql',
  credentials: 'include',
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: 'ws://localhost:4000/graphql',
  })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          posts: {
            merge(existing = [], incoming) {
              return [...existing, ...incoming];
            },
          },
        },
      },
    },
  }),
});
\`\`\`

### Hooks Usage
\`\`\`typescript
// hooks/useUser.ts
import { gql, useQuery, useMutation } from '@apollo/client';

const GET_USER = gql\`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      name
      email
      posts {
        id
        title
      }
    }
  }
\`;

const CREATE_USER = gql\`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      name
      email
    }
  }
\`;

export function useUser(id: string) {
  const { data, loading, error } = useQuery(GET_USER, {
    variables: { id },
    skip: !id,
  });
  
  return { user: data?.user, loading, error };
}

export function useCreateUser() {
  const [createUser, { loading, error }] = useMutation(CREATE_USER, {
    update(cache, { data }) {
      cache.modify({
        fields: {
          users(existingUsers = []) {
            const newUserRef = cache.writeFragment({
              data: data.createUser,
              fragment: gql\`
                fragment NewUser on User {
                  id
                  name
                  email
                }
              \`,
            });
            return [...existingUsers, newUserRef];
          },
        },
      });
    },
  });
  
  return { createUser, loading, error };
}
\`\`\`

## POTHOS (Code-First Schema)

\`\`\`typescript
// schema.ts
import SchemaBuilder from '@pothos/core';
import PrismaPlugin from '@pothos/plugin-prisma';
import { prisma } from './prisma';

const builder = new SchemaBuilder({
  plugins: [PrismaPlugin],
  prisma: { client: prisma },
});

builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID('id'),
    email: t.exposeString('email'),
    name: t.exposeString('name'),
    posts: t.relation('posts'),
  }),
});

builder.prismaObject('Post', {
  fields: (t) => ({
    id: t.exposeID('id'),
    title: t.exposeString('title'),
    content: t.exposeString('content'),
    author: t.relation('author'),
  }),
});

builder.queryType({
  fields: (t) => ({
    user: t.prismaField({
      type: 'User',
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      resolve: (query, _, { id }) =>
        prisma.user.findUnique({ ...query, where: { id } }),
    }),
    users: t.prismaField({
      type: ['User'],
      resolve: (query) => prisma.user.findMany({ ...query }),
    }),
  }),
});

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: 'User',
      args: {
        email: t.arg.string({ required: true }),
        name: t.arg.string({ required: true }),
      },
      resolve: (query, _, { email, name }) =>
        prisma.user.create({ ...query, data: { email, name } }),
    }),
  }),
});

export const schema = builder.toSchema();
\`\`\`

## HASURA (Instant GraphQL)

\`\`\`yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgrespassword
    volumes:
      - db_data:/var/lib/postgresql/data

  hasura:
    image: hasura/graphql-engine:v2.36.0
    ports:
      - "8080:8080"
    environment:
      HASURA_GRAPHQL_DATABASE_URL: postgres://postgres:postgrespassword@postgres:5432/postgres
      HASURA_GRAPHQL_ENABLE_CONSOLE: "true"
      HASURA_GRAPHQL_ADMIN_SECRET: myadminsecret
      HASURA_GRAPHQL_JWT_SECRET: '{"type":"HS256","key":"your-secret-key"}'
\`\`\`

## CODEGEN

\`\`\`yaml
# codegen.yml
schema: http://localhost:4000/graphql
documents: src/**/*.graphql
generates:
  src/generated/graphql.ts:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      withComponent: false
\`\`\`

## FEDERATION (Microservices)

\`\`\`typescript
// users-subgraph/schema.ts
import { gql } from 'graphql-tag';

export const typeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

  type User @key(fields: "id") {
    id: ID!
    email: String!
    name: String!
  }

  type Query {
    user(id: ID!): User
    users: [User!]!
  }
\`;

// posts-subgraph/schema.ts
export const typeDefs = gql\`
  extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key", "@external"])

  type Post @key(fields: "id") {
    id: ID!
    title: String!
    author: User!
  }

  extend type User @key(fields: "id") {
    id: ID! @external
    posts: [Post!]!
  }

  type Query {
    post(id: ID!): Post
    posts: [Post!]!
  }
\`;
\`\`\`

## SECURITY

### Authentication
\`\`\`typescript
// context.ts
export async function createContext({ req }): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  let user = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    } catch (e) {
      // Invalid token
    }
  }
  
  return { user, prisma, loaders: createLoaders() };
}
\`\`\`

### Authorization (Directives)
\`\`\`typescript
// directives/auth.ts
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { defaultFieldResolver } from 'graphql';

export function authDirective(directiveName: string) {
  return {
    authDirectiveTypeDefs: \`directive @\${directiveName}(requires: Role = ADMIN) on FIELD_DEFINITION\`,
    authDirectiveTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
          const authDirective = getDirective(schema, fieldConfig, directiveName)?.[0];
          if (authDirective) {
            const { requires } = authDirective;
            const { resolve = defaultFieldResolver } = fieldConfig;
            
            fieldConfig.resolve = async function (source, args, context, info) {
              if (!context.user) {
                throw new AuthenticationError('Not authenticated');
              }
              if (requires && context.user.role !== requires) {
                throw new ForbiddenError('Not authorized');
              }
              return resolve(source, args, context, info);
            };
          }
          return fieldConfig;
        },
      }),
  };
}
\`\`\`

## PERFORMANCE

### Query Complexity
\`\`\`typescript
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const complexityLimitRule = createComplexityLimitRule(1000, {
  onCost: (cost) => console.log('Query cost:', cost),
});

const server = new ApolloServer({
  schema,
  validationRules: [complexityLimitRule],
});
\`\`\`

### Depth Limiting
\`\`\`typescript
import depthLimit from 'graphql-depth-limit';

const server = new ApolloServer({
  schema,
  validationRules: [depthLimit(5)],
});
\`\`\`

## CHECKLIST

### Schema Design
- [ ] Types bem definidos com nullability correta?
- [ ] Inputs separados de Types?
- [ ] Enums para valores fixos?
- [ ] Conexões paginadas (Relay-style)?

### Performance
- [ ] DataLoaders para N+1?
- [ ] Query complexity limits?
- [ ] Depth limiting?
- [ ] Persisted queries?

### Security
- [ ] Authentication no context?
- [ ] Authorization por field?
- [ ] Rate limiting?
- [ ] Introspection desabilitada em prod?

## ANTI-PATTERNS

❌ **NUNCA** exponha dados sensíveis sem auth
❌ **NUNCA** ignore o problema N+1
❌ **NUNCA** permita queries infinitamente profundas
❌ **NUNCA** retorne erros internos para o cliente
❌ **NUNCA** use REST patterns em GraphQL
`;

export default GRAPHQL_SUPREME_MANIFEST;
