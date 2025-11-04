import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { Logger } from "../logging/interface.js";
import type { WebhookContent } from "../webhook.js";
import type { WebhookBody } from "../schemas.js";
import {
    extensionAddedToContextKind,
    instanceRemovedKind,
    instanceUpdatedKind,
    secretRotatedKind,
    webhookSchema,
} from "../schemas.js";
import { InvalidBodyError } from "../errors.js";

export class CombinedPersistenceWebhookHandler implements WebhookHandler {
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
        const body = this.getValidatedWebhookBody(webhookContent.rawBody);

        try {
            switch (body.kind) {
                case extensionAddedToContextKind:
                    await this.extensionStorage.upsertExtension({
                        extensionInstanceId: body.id,
                        contextId: body.context.id,
                        secret: body.secret,
                        consentedScopes: body.consentedScopes,
                        variantKey: body.variantKey,
                    });
                    break;
                case instanceUpdatedKind:
                    await this.extensionStorage.updateExtension({
                        extensionInstanceId: body.id,
                        contextId: body.context.id,
                        consentedScopes: body.consentedScopes,
                        enabled: body.state.enabled,
                        variantKey: body.variantKey,
                    });
                    break;
                case secretRotatedKind:
                    await this.extensionStorage.rotateSecret(body.id, body.secret);
                    break;
                case instanceRemovedKind:
                    await this.extensionStorage.removeInstance(body.id);
            }
        } catch (e) {
            this.logger.error(`Failed to persist extension: ${(e as Error).toString()}`);
            throw e;
        }

        await next(webhookContent);
        return;
    }

    private getValidatedWebhookBody(body: string): WebhookBody {
        try {
            const bodyJSON: unknown = JSON.parse(body);
            return webhookSchema.parse(bodyJSON);
        } catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            const errorMessage =
                "Request body does not match the expected schema." + error;
            throw new InvalidBodyError(errorMessage);
        }
    }
}
