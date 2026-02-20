import type {
    ExtensionStorage,
    ExtensionToBeAdded,
    ExtensionToBeUpdated,
} from "@weissaufschwarz/mitthooks/storage/extensionStorage";
import { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
    buildExtensionInstanceTable,
    ExtensionInstanceTable,
} from "./schema.js";
import { eq } from "drizzle-orm";

export type DbClientWithExtensionInstances = NodePgDatabase<{
    extensionInstances: ExtensionInstanceTable;
}>;

export class PgExtensionStorage implements ExtensionStorage {
    private db: DbClientWithExtensionInstances;
    private extensionInstanceTable: ReturnType<
        typeof buildExtensionInstanceTable
    >;

    public constructor(
        db: DbClientWithExtensionInstances,
        extensionInstanceTable: ExtensionInstanceTable,
    ) {
        this.db = db;
        this.extensionInstanceTable = extensionInstanceTable;
    }

    public async upsertExtension(extension: ExtensionToBeAdded): Promise<void> {
        try {
            await this.db
                .insert(this.extensionInstanceTable)
                .values({
                    id: extension.extensionInstanceId,
                    contextId: extension.contextId,
                    context: "project",
                    active: true,
                    consentedScopes: extension.consentedScopes,
                    secret: extension.secret,
                    variantKey: extension.variantKey ?? null,
                })
                .onConflictDoUpdate({
                    target: this.extensionInstanceTable.id,
                    set: {
                        contextId: extension.contextId,
                        updatedAt: new Date(),
                        context: "project",
                        active: true,
                        secret: extension.secret,
                        variantKey: extension.variantKey ?? null,
                    },
                });
        } catch (error) {
            console.error("Error upserting extension:", error);
            throw new Error("Failed to upsert extension instance");
        }
    }

    public async updateExtension(
        extension: ExtensionToBeUpdated,
    ): Promise<void> {
        try {
            await this.db
                .update(this.extensionInstanceTable)
                .set({
                    contextId: extension.contextId,
                    updatedAt: new Date(),
                    context: "project",
                    active: extension.enabled,
                    consentedScopes: extension.consentedScopes,
                    variantKey: extension.variantKey ?? null,
                })
                .where(
                    eq(
                        this.extensionInstanceTable.id,
                        extension.extensionInstanceId,
                    ),
                );
        } catch (error) {
            console.error("Error updating extension:", error);
            throw new Error("Failed to update extension instance");
        }
    }

    public async rotateSecret(
        extensionInstanceId: string,
        secret: string,
    ): Promise<void> {
        try {
            await this.db
                .update(this.extensionInstanceTable)
                .set({
                    secret: secret,
                })
                .where(eq(this.extensionInstanceTable.id, extensionInstanceId));
        } catch (error) {
            console.error("Error rotating extension instance secret:", error);
            throw new Error("Failed to extension instance secret");
        }
    }

    public async removeInstance(extensionInstanceId: string): Promise<void> {
        try {
            await this.db
                .delete(this.extensionInstanceTable)
                .where(eq(this.extensionInstanceTable.id, extensionInstanceId));
        } catch (error) {
            console.error("Error removing extension instance:", error);
            throw new Error("Failed to remove extension instance");
        }
    }
}
