import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { WebhookContent } from "../webhook.js";
import type { InstanceUpdatedWebhookBody } from "../schemas.js";
import { instanceUpdatedWebhookSchema } from "../schemas.js";
import { InvalidBodyError } from "../errors.js";

export class InstanceUpdatedWebhookHandler implements WebhookHandler {
    private readonly extensionStorage: ExtensionStorage;

    public constructor(extensionStorage: ExtensionStorage) {
        this.extensionStorage = extensionStorage;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        const body = this.getValidatedWebhookBody(webhookContent.rawBody);

        await this.extensionStorage.updateExtension({
            extensionInstanceId: body.id,
            contextId: body.context.id,
            consentedScopes: body.consentedScopes,
            enabled: body.state.enabled,
        });

        return next(webhookContent);
    }

    private getValidatedWebhookBody(body: string): InstanceUpdatedWebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return instanceUpdatedWebhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
