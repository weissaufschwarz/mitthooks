import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { WebhookVerifier } from "../verification/verify.js";
import type { WebhookContent } from "../webhook.js";
import type {Logger} from "../logging/interface.js";
import { InvalidSignatureError } from "../errors.js";

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
        let verified: boolean;
        try {
            verified = await this.webhookVerifier.verify(webhookContent);
        } catch (e) {
            this.logger.error(`Failed to verify webhook signature: ${(e as Error).toString()}`);
            throw e;
        }

        // Strict comparison against `true`: a signature mismatch resolves to
        // `false` rather than throwing, and only an explicit `true` may pass.
        // The comparison is deliberately redundant for TypeScript callers, but
        // guards this security boundary against a verifier that resolves to a
        // truthy non-boolean.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare -- deliberate strictness at a security boundary
        if (verified !== true) {
            this.logger.error("Failed to verify webhook signature: signature does not match");
            throw new InvalidSignatureError();
        }

        return next(webhookContent);
    }
}
