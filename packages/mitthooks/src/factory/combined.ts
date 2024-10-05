import { BaseWebhookHandlerFactory } from "./base.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type { HandleWebhook } from "../handler/interface.js";
import { CombinedPersistenceWebhookHandler } from "../handler/combinedPersistence.js";

export class CombinedWebhookHandlerFactory extends BaseWebhookHandlerFactory {
    public constructor(extensionStorage: ExtensionStorage) {
        super(extensionStorage);
    }

    public build(): HandleWebhook {
        this.appendDefaultWebhookHandler();

        this.baseHandlerChain = this.baseHandlerChain.withAdditionalHandlers(
            new CombinedPersistenceWebhookHandler(
                this.extensionStorage,
                this.logger,
            ),
        );
        const handlerChain = this.appendHandlerChainSuffix();

        return handlerChain.handleWebhook.bind(handlerChain);
    }
}
