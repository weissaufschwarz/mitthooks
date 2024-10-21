import { z } from "zod";

export const extensionAddedToContextKind = "ExtensionAddedToContext";
export const instanceUpdatedKind = "InstanceUpdated";
export const secretRotatedKind = "SecretRotated";
export const instanceRemovedKind = "InstanceRemovedFromContext";

export const webhookMetaSchema = z.object({
        extensionId: z.string(),
        contributorId: z.string(),
    })

export const webhookRequestSchema = z.object({
    id: z.string(),
    createdAt: z.string(),
    target: z.object({
        method: z.enum(["GET", "POST", "PUT", "DELETE"]),
        url: z.string(),
    }),
})

export const webhookContextSchema = z.object({
    id: z.string(),
    kind: z.enum(["customer", "project"]),
})

export const webhookBaseSchema = z.object({
    apiVersion: z.string(),
    id: z.string(),
    context: webhookContextSchema,
    meta: webhookMetaSchema,
    request: webhookRequestSchema,
})

export const extensionAddedToContextWebhookSchema = webhookBaseSchema.extend({
    kind: z.literal(extensionAddedToContextKind),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
    }),
    secret: z.string(),
});

export type ExtensionAddedToContextWebhookBody = z.infer<
    typeof extensionAddedToContextWebhookSchema
>;

export const instanceUpdatedWebhookSchema = webhookBaseSchema.extend({
    kind: z.literal(instanceUpdatedKind),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
    }),
});

export type InstanceUpdatedWebhookBody = z.infer<
    typeof instanceUpdatedWebhookSchema
>;

export const secretRotatedWebhookSchema = webhookBaseSchema.extend({
    kind: z.literal(secretRotatedKind),
    secret: z.string(),
});

export type SecretRotatedWebhookBody = z.infer<
    typeof secretRotatedWebhookSchema
>;

export const instanceRemovedWebhookSchema = webhookBaseSchema.extend({
    kind: z.literal(instanceRemovedKind),
    consentedScopes: z.array(z.string()),
    state: z.object({
        enabled: z.boolean(),
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
