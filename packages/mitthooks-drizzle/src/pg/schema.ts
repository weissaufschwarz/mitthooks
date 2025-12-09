import { boolean, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { pgEnum } from "drizzle-orm/pg-core/columns/enum";
import { pgTable } from "drizzle-orm/pg-core/table";
import { EncryptedTextColumn } from "./encryption.js";

const timestamps = {
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp()
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
};

export const context = pgEnum("context", ["customer", "project"]);

export const buildExtensionInstanceTable = (
  secretColumn: EncryptedTextColumn,
  additionalColumns: Record<string, any> = {}
) =>
  pgTable("extension_instance", {
    id: varchar("id", { length: 36 }).primaryKey(),
    contextId: varchar({ length: 36 }).notNull(),
    context: context().notNull().default("project"),
    active: boolean().notNull(),
    variantKey: text("variant_key"),
    consentedScopes: text("consented_scopes").array().notNull(),
    secret: secretColumn(),
    ...timestamps,
    ...additionalColumns,
  });

export type ExtensionInstanceTable = ReturnType<
    typeof buildExtensionInstanceTable
>;
