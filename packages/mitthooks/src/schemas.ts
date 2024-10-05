import { z } from "zod";

export const extensionAddedToContextKind = "ExtensionAddedToContext";
export const instanceUpdatedKind = "InstanceUpdated";
export const secretRotatedKind = "SecretRotated";
export const instanceRemovedKind = "InstanceRemovedFromContext";

export const extensionAddedToContextWebhookSchema = z.object({
    id: z.string(),
    apiVersion: z.string(),
    kind: z.literal(extensionAddedToContextKind),
    context: z.object({
        id: z.string(),
        kind: z.enum(["customer", "project"]),
    }),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
    }),
    meta: z.object({
        createdAt: z.string().optional(),
    }),
    secret: z.string(),
});

export type ExtensionAddedToContextWebhookBody = z.infer<
    typeof extensionAddedToContextWebhookSchema
>;

export const instanceUpdatedWebhookSchema = z.object({
    id: z.string(),
    apiVersion: z.string(),
    kind: z.literal(instanceUpdatedKind),
    context: z.object({
        id: z.string(),
        kind: z.enum(["customer", "project"]),
    }),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
    }),
    meta: z.object({
        createdAt: z.string().optional(),
    }),
});

export type InstanceUpdatedWebhookBody = z.infer<
    typeof instanceUpdatedWebhookSchema
>;

export const secretRotatedWebhookSchema = z.object({
    id: z.string(),
    apiVersion: z.string(),
    kind: z.literal(secretRotatedKind),
    secret: z.string(),
});

export type SecretRotatedWebhookBody = z.infer<
    typeof secretRotatedWebhookSchema
>;

export const instanceRemovedWebhookSchema = z.object({
    id: z.string(),
    apiVersion: z.string(),
    kind: z.literal(instanceRemovedKind),
    context: z.object({
        id: z.string(),
        kind: z.enum(["customer", "project"]),
    }),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
    }),
    meta: z.object({
        createdAt: z.string().optional(),
    }),
});

export type InstanceRemovedWebhookBody = z.infer<
    typeof instanceRemovedWebhookSchema
>;

export const webhookSchema = z.union([
    extensionAddedToContextWebhookSchema,
    instanceUpdatedWebhookSchema,
    secretRotatedWebhookSchema,
    instanceRemovedWebhookSchema,
]);

export type WebhookBody = z.infer<typeof webhookSchema>;

export type WebhookKind = WebhookBody["kind"];
