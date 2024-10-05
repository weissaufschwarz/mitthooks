import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { WebhookVerifier } from "../verification/verify.js";
import type { WebhookContent } from "../webhook.js";

export class VerifyingWebhookHandler implements WebhookHandler {
    private readonly webhookVerifier: WebhookVerifier;

    public constructor(webhookVerifier: WebhookVerifier) {
        this.webhookVerifier = webhookVerifier;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        await this.webhookVerifier.verify(webhookContent);
        return next(webhookContent);
    }
}
