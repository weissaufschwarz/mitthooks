import type {HandleWebhook, WebhookHandler} from "./interface.js";
import type {WebhookContent} from "../webhook.js";
import {WebhookBody, webhookSchema,} from "../schemas.js";
import {InvalidBodyError, InvalidExtensionIDError} from "../errors.js";

export class ExtensionIDVerificationWebhookHandler implements WebhookHandler {
    private readonly extensionID: string;

    public constructor(extensionID: string) {
        this.extensionID = extensionID;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        const body = this.getValidatedWebhookBody(webhookContent.rawBody);
        if (body.meta.extensionId !== this.extensionID) {
            throw new InvalidExtensionIDError(body.meta.extensionId)
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
