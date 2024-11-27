import type { WebhookContent } from "../webhook.js";

export type HandleWebhook = (webhookContent: WebhookContent) => Promise<void> | void;

export interface WebhookHandler {
    handleWebhook: (
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ) => Promise<void> | void;
}
