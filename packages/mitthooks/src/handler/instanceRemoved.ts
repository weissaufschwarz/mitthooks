import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { WebhookContent } from "../webhook.js";
import type { InstanceRemovedWebhookBody } from "../schemas.js";
import { instanceRemovedWebhookSchema } from "../schemas.js";
import { InvalidBodyError } from "../errors.js";
import type {Logger} from "../logging/interface.js";

export class InstanceRemovedWebhookHandler implements WebhookHandler {
    private readonly extensionStorage: ExtensionStorage;
    private readonly logger: Logger;

    public constructor(extensionStorage: ExtensionStorage, logger: Logger) {
        this.extensionStorage = extensionStorage;
        this.logger = logger;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        try {
            const body = this.getValidatedWebhookBody(webhookContent.rawBody);
            await this.extensionStorage.removeInstance(body.id);
        } catch (e) {
            this.logger.error(`Failed to remove instance: ${(e as Error).toString()}`);
            throw e;
        }

        return next(webhookContent);
    }

    private getValidatedWebhookBody(body: string): InstanceRemovedWebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return instanceRemovedWebhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
