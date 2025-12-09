# mitthooks-drizzle

[Drizzle ORM](https://orm.drizzle.team/) integration for the mitthooks SDK.
This package provides a PostgreSQL-based `ExtensionStorage` implementation using Drizzle ORM with built-in encryption support for sensitive data.

## Features

- PostgreSQL-based storage implementation for mitthooks extension instances
- Built-in encryption for sensitive data (secrets) using AES-256-GCM
- Type-safe database schema using Drizzle ORM
- Automatic timestamp management
- Support for all extension lifecycle operations (install, update, rotate secret, uninstall)
- Extensible schema - add custom columns to the extension instance table

## Why Does This Package Include Schema Builders?

PostgreSQL is a schema-based relational database, which means table structures must be explicitly defined before data can be stored. Unlike schemaless databases like MongoDB where you can simply store JSON documents without predefined structure, PostgreSQL requires:

- Defined column types (varchar, text, boolean, etc.)
- Constraints and relationships
- Indexes and keys
- Migration management

This package provides schema builder functions (`buildExtensionInstanceTable`, `buildEncryptedTextColumn`) rather than managing its own separate database connection or schema. This design allows you to:

- **Integrate seamlessly** - Add the extension instance table to your existing Drizzle schema alongside your application's tables
- **Customize encryption** - Configure your own encryption keys based on your security requirements
- **Extend the schema** - Add custom columns to track additional data specific to your use case
- **Control migrations** - Manage the extension instance table through your application's migration workflow
- **Type safety** - Benefit from Drizzle's type-safe query builder across your entire schema

This approach treats extension storage as a first-class part of your application's database schema, giving you the flexibility and control that Drizzle ORM provides while ensuring everything works together cohesively.

## Installation

```bash
npm install @weissaufschwarz/mitthooks-drizzle drizzle-orm pg
```

Note: `drizzle-orm` and `pg` are peer dependencies and must be installed separately.

## Usage

### 1. Define your database schema

Create a schema file (e.g., `schema.ts`) that exports the extension instance table:

```typescript
import { buildEncryptedTextColumn, buildEncryptionKey } from "@weissaufschwarz/mitthooks-drizzle/pg/encryption";
import { buildExtensionInstanceTable } from "@weissaufschwarz/mitthooks-drizzle/pg/schema";

// Export the context enum for use in your schema
export { context } from "@weissaufschwarz/mitthooks-drizzle/pg/schema";

// Build the encryption key from your environment variables
const encryptionKey = buildEncryptionKey(
    process.env.ENCRYPTION_MASTER_PASSWORD!,
    process.env.ENCRYPTION_SALT!
);

// Build the encrypted text column
const encryptedTextColumn = buildEncryptedTextColumn(encryptionKey);

// Export the extension instances table
export const extensionInstances = buildExtensionInstanceTable(encryptedTextColumn);
```

The `buildExtensionInstanceTable` function creates a table with the following columns:
- `id` - Unique identifier (varchar, 36 chars, primary key)
- `contextId` - Context identifier, either projectId or customerId (varchar, 36 chars)
- `context` - Context type enum ("customer" or "project")
- `active` - Whether the extension instance is active (boolean)
- `variantKey` - Optional variant key (text)
- `consentedScopes` - Array of consented scopes (text array)
- `secret` - Encrypted secret (text, encrypted using AES-256-GCM)
- `createdAt` - Creation timestamp (automatic)
- `updatedAt` - Last update timestamp (automatic)

#### Extending the schema with custom columns

You can add custom columns to the extension instance table by passing them as the second parameter to `buildExtensionInstanceTable`:

```typescript
import { text, integer } from "drizzle-orm/pg-core";
import { buildEncryptedTextColumn, buildEncryptionKey } from "@weissaufschwarz/mitthooks-drizzle/pg/encryption";
import { buildExtensionInstanceTable } from "@weissaufschwarz/mitthooks-drizzle/pg/schema";

export const extensionInstances = buildExtensionInstanceTable(
    buildEncryptedTextColumn(
        buildEncryptionKey(
            process.env.ENCRYPTION_MASTER_PASSWORD!,
            process.env.ENCRYPTION_SALT!
        )
    ),
    {
        customField: text("custom_field"),
        counter: integer("counter").default(0),
    }
);
```

**Important:** Custom columns must be nullable or have default values, as the webhook handlers do not set these fields when managing extension instances.

### 2. Initialize the extension storage

Use the `PgExtensionStorage` class with your Drizzle database instance:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { PgExtensionStorage } from "@weissaufschwarz/mitthooks-drizzle/pg";
import { CombinedWebhookHandlerFactory } from "@weissaufschwarz/mitthooks/factory/combined";
import * as schema from "./schema";

// Create a PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create a Drizzle database instance
const db = drizzle(pool, {
    schema,
});

// Create the extension storage
const extensionStorage = new PgExtensionStorage(db, schema.extensionInstances);

// Use it with the mitthooks webhook handler
const combinedHandler = new CombinedWebhookHandlerFactory(
    extensionStorage,
    process.env.EXTENSION_ID!,
).build();
```

## Encryption

The package uses AES-256-GCM encryption for storing sensitive data (secrets). The encryption key is derived from a master password and salt using the scrypt key derivation function.

### Environment Variables

It is strongly recommended to provide the master password and salt via environment variables:

- Master password for encryption key derivation
- Salt for encryption key derivation

The environment variable names can be chosen freely based on your project's conventions.

**Important:** Once set, these values must never be changed. Changing either the master password or salt will make it impossible to decrypt existing encrypted data in your database.

Make sure to keep these values secret and never commit them to version control.

#### Generating Secure Values

You can generate secure random values for the master password and salt using Node.js:

```bash
# Generate a secure master password (32 bytes, base64 encoded)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate a secure salt (16 bytes, base64 encoded)
node -e "console.log(require('crypto').randomBytes(16).toString('base64'))"
```

Store these values in your environment configuration (e.g., `.env` file for local development, secrets manager for production).

### Encryption Details

- Algorithm: AES-256-GCM
- Key derivation: scrypt with custom salt
- Initialization vector: 12 bytes (randomly generated for each encryption)
- Authentication tag: Included for data integrity verification
- Storage format: `base64(iv):base64(encrypted):base64(tag)`

## Database Migration

Make sure to run database migrations to create the `extension_instance` table before using this package. The table schema can be generated using Drizzle Kit:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate

# or for empty databases
npx drizzle-kit push
```

Refer to the [Drizzle ORM documentation](https://orm.drizzle.team/docs/overview) for more information on migrations.