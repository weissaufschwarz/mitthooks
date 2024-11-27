import type {HandleWebhook, WebhookHandler} from "./interface.js";
import type {WebhookContent} from "../webhook.js";
import type {WebhookBody} from "../schemas.js";
import {webhookSchema} from "../schemas.js";
import {InvalidBodyError, InvalidExtensionIDError} from "../errors.js";
import type {Logger} from "../logging/interface.js";

export class ExtensionIDVerificationWebhookHandler implements WebhookHandler {
    private readonly extensionID: string;
    private readonly logger: Logger;

    public constructor(extensionID: string, logger: Logger) {
        this.extensionID = extensionID;
        this.logger = logger;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        try {
            const body = this.getValidatedWebhookBody(webhookContent.rawBody);
            if (body.meta.extensionId !== this.extensionID) {
                throw new InvalidExtensionIDError(body.meta.extensionId)
            }
        } catch (e) {
            this.logger.error(`failed to verify extension id: ${(e as Error).toString()}`);
            throw e;
        }
        return next(webhookContent);
    }

    private getValidatedWebhookBody(
        body: string,
    ): WebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return webhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Failed to check extension ID of webhook payload. Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
