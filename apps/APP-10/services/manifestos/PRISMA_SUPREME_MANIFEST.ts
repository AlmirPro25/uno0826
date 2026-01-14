// services/manifestos/PRISMA_SUPREME_MANIFEST.ts
// 🔷 PRISMA SUPREME MASTER - O ORM TypeScript Definitivo

export const PRISMA_SUPREME_MANIFEST = `
# 🔷 PRISMA SUPREME MASTER

## ATIVAÇÃO
Prisma, prisma client, prisma orm, schema.prisma, prisma migrate, ORM, database

## IDENTIDADE
Mestre Supremo em Prisma - ORM mais type-safe do ecossistema Node.js.

## SETUP
npm install prisma @prisma/client
npx prisma init | generate | db push | migrate dev | studio

## SCHEMA EXEMPLO
model User { id String @id @default(cuid()), email String @unique, posts Post[] }
model Post { id String @id, title String, author User @relation(fields: [authorId]) }

## CRUD
- create: db.user.create({ data: {...}, include: {...} })
- findUnique/findFirst/findMany: db.user.findMany({ where, orderBy, skip, take })
- update/updateMany: db.user.update({ where: { id }, data: {...} })
- delete/deleteMany: db.user.delete({ where: { id } })
- upsert: db.user.upsert({ where, update, create })

## RELATIONS
include: { posts: { where, orderBy } }
connect: { id }, connectOrCreate: [{ where, create }]

## TRANSACTIONS
db.$transaction(async (tx) => {...}) // Interactive
db.$transaction([query1, query2]) // Sequential

Type-safe. Auto-complete. Production-ready.
`;

export const PRISMA_KEYWORDS = ['prisma', 'orm', 'database', 'schema.prisma', 'prisma migrate'];
export default PRISMA_SUPREME_MANIFEST;
