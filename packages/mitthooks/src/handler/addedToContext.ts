import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { WebhookContent } from "../webhook.js";
import type { ExtensionAddedToContextWebhookBody } from "../schemas.js";
import { extensionAddedToContextWebhookSchema } from "../schemas.js";
import { InvalidBodyError } from "../errors.js";

export class AddedToContextWebhookHandler implements WebhookHandler {
    private readonly extensionStorage: ExtensionStorage;

    public constructor(extensionStorage: ExtensionStorage) {
        this.extensionStorage = extensionStorage;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        const body = this.getValidatedWebhookBody(webhookContent.rawBody);

        await this.extensionStorage.upsertExtension({
            extensionInstanceId: body.id,
            contextId: body.context.id,
            secret: body.secret,
            consentedScopes: body.consentedScopes,
        });

        return next(webhookContent);
    }

    private getValidatedWebhookBody(
        body: string,
    ): ExtensionAddedToContextWebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return extensionAddedToContextWebhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
