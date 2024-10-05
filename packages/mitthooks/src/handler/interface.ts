import type { WebhookContent } from "../webhook.js";

export type HandleWebhook = (webhookContent: WebhookContent) => Promise<void>;

export interface WebhookHandler {
    handleWebhook: (
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ) => Promise<void>;
}
