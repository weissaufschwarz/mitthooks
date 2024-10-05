import type { WebhookKind } from "../schemas.js";
import {
    extensionAddedToContextKind,
    instanceRemovedKind,
    instanceUpdatedKind,
    secretRotatedKind,
} from "../schemas.js";
import type { HandleWebhook } from "../handler/interface.js";
import { BaseWebhookHandlerFactory } from "./base.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import { AddedToContextWebhookHandler } from "../handler/addedToContext.js";
import { InstanceUpdatedWebhookHandler } from "../handler/instanceUpdated.js";
import { SecretRotatedWebhookHandler } from "../handler/secretRotated.js";
import { InstanceRemovedWebhookHandler } from "../handler/instanceRemoved.js";

export type SeparateWebhookHandlers = {
    [kind in WebhookKind]: HandleWebhook;
};

export class SeparateWebhookHandlerFactory extends BaseWebhookHandlerFactory {
    public constructor(extensionStorage: ExtensionStorage) {
        super(extensionStorage);
    }

    public build(): SeparateWebhookHandlers {
        this.appendDefaultWebhookHandler();

        return {
            [extensionAddedToContextKind]: this.baseHandlerChain
                .withAdditionalHandlers(
                    new AddedToContextWebhookHandler(this.extensionStorage),
                    ...this.handlerChainSuffix,
                )
                .handleWebhook.bind(this.baseHandlerChain),
            [instanceUpdatedKind]: this.baseHandlerChain
                .withAdditionalHandlers(
                    new InstanceUpdatedWebhookHandler(this.extensionStorage),
                    ...this.handlerChainSuffix,
                )
                .handleWebhook.bind(this.baseHandlerChain),
            [secretRotatedKind]: this.baseHandlerChain
                .withAdditionalHandlers(
                    new SecretRotatedWebhookHandler(this.extensionStorage),
                    ...this.handlerChainSuffix,
                )
                .handleWebhook.bind(this.baseHandlerChain),
            [instanceRemovedKind]: this.baseHandlerChain
                .withAdditionalHandlers(
                    new InstanceRemovedWebhookHandler(this.extensionStorage),
                    ...this.handlerChainSuffix,
                )
                .handleWebhook.bind(this.baseHandlerChain),
        };
    }
}
