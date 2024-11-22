import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { WebhookContent } from "../webhook.js";
import type { SecretRotatedWebhookBody } from "../schemas.js";
import { secretRotatedWebhookSchema } from "../schemas.js";
import { InvalidBodyError } from "../errors.js";
import type {Logger} from "../logging/interface.js";

export class SecretRotatedWebhookHandler implements WebhookHandler {
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
            await this.extensionStorage.rotateSecret(body.id, body.secret);
        } catch (e) {
            this.logger.error(`Failed to rotate secret: ${(e as Error).toString()}`);
            throw e;
        }

        return next(webhookContent);
    }

    private getValidatedWebhookBody(body: string): SecretRotatedWebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return secretRotatedWebhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
