import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { WebhookVerifier } from "../verification/verify.js";
import type { WebhookContent } from "../webhook.js";
import type {Logger} from "../logging/interface.js";

export class VerifyingWebhookHandler implements WebhookHandler {
    private readonly webhookVerifier: WebhookVerifier;
    private readonly logger: Logger;

    public constructor(webhookVerifier: WebhookVerifier, logger: Logger) {
        this.webhookVerifier = webhookVerifier;
        this.logger = logger;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        try {
            await this.webhookVerifier.verify(webhookContent);
        } catch (e) {
            this.logger.error(`Failed to verify webhook signature: ${(e as Error).toString()}`);
            throw e;
        }
        return next(webhookContent);
    }
}
