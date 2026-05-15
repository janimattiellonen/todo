---
name: project-conventions
description: Project architecture and code conventions — route structure, feature organization, branded types, database query naming, and file organization.
user-invocable: false
---

# Project conventions

## Slim routes

Route files in `app/routes/` are thin wiring layers only:

- **Loader:** fetch data via feature query functions, redirect if auth is missing
- **Action:** delegate to feature functions, return results
- **Component:** `return <FeaturePage {...loaderData} />`

No business logic in route files. If logic is needed, it belongs in `app/features/`.

## Business logic in features

- All business logic lives in `app/features/<domain>/`
- Feature components, types, and query functions are co-located per domain
- Route components are thin wrappers; feature components own all UI logic
- Features are vertical slices and should be as self-contained as possible — a feature should not reach into other features

## Branded types for IDs and important properties

- Use `Branded<T, B>` from `~/types` for all domain IDs and other critical string/number properties
- Declare the type and a `toXxx(value)` converter in a `<domain>Types.ts` file:

```ts
// app/features/users/userTypes.ts
import { type Branded } from "~/types";

export type UserId = Branded<string, "UserId">;
export function toUserId(value: string): UserId { return value as UserId; }
```

- Use a Zod transform when parsing from external sources (DB rows, form data):

```ts
z.string().transform(toUserId)
```

- Never pass a raw `string` where a branded type is expected

## Explicit transaction boundaries

Always use explicit transaction boundaries for database operations. Create a transaction by calling `pool.transaction` and pass the connection to `query*` functions. Type it as `connection: DatabaseTransactionConnection`.

```ts
import { type DatabaseTransactionConnection } from "slonik";

export async function createUser(pool: DatabasePool, input: Input) {
  return pool.transaction(async (connection) => {
    const user = await queryInsertUser(connection, input);

    await queryInsertAuditLog(connection, { userId: user.id, action: "created" });

    return user;
  });
}

export async function queryInsertUser(connection: DatabaseTransactionConnection, input: Input) { ... }
```

## Database query file naming

- All files that interact with the database must end in `.server.ts`
- File name starts with the function it exports:
  - `queryUserByEmail.server.ts`
  - `queryInsertMagicLinkToken.server.ts`
  - `queryMarkMagicLinkTokenUsed.server.ts`
- The exported function name mirrors the file name (camelCase)
- All DB interaction functions start with `query` — including inserts, updates, and deletes

```ts
// app/features/users/queryUserByEmail.server.ts
export async function queryUserByEmail(pool: DatabasePool, email: Email) { ... }
```

## Props destructuring

Never destructure `props` in React components unless required to satisfy TypeScript (e.g. a prop named `ref`). Access props directly:

```tsx
// correct
function UserCard(props: Props) {
  return <div>{props.name}</div>;
}

// avoid
function UserCard({ name }: Props) {
  return <div>{name}</div>;
}
```

## Input objects for functions with more than 2 parameters

When a function takes more than 2 parameters, group them into a named `Input` type (declared locally in the same file):

```ts
type Input = {
  userId: UserId;
  token: MagicLinkToken;
  expiresAt: Date;
};

export async function queryInsertMagicLinkToken(pool: DatabasePool, input: Input) { ... }
```

The first parameter (`pool`, `request`, etc.) stays separate — only the domain-specific arguments are grouped.

## Explicit field selection over the wire

Never return full objects from loaders or actions. Always list fields explicitly to avoid leaking sensitive data:

```ts
// correct
return {
  user: {
    email: user.email,
    role: user.role,
    customerId: user.customerId,
  },
};

// avoid — may expose sensitive fields (passwordHash, tokens, etc.)
return {
  user,
};
```

This applies to all data returned to the client — loaders, actions, and any JSON responses.

## Prefer existing UI components over custom CSS

Before writing custom CSS or inline styles, check `app/ui/` for existing UI components that already handle the styling. Always prefer composing existing components over creating custom CSS.

For simple ui elements like buttons, create the component instead of using a 3rd party ui libraries. Defer using 3rd party ui libraries for as long as possible.

## File organization: important code first

- In React component files: component function at the top, StyleX styles at the bottom
- In any file: exported API (functions, types) before implementation details
