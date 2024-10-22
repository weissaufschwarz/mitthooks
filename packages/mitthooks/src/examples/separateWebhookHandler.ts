import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type {
    SeparateWebhookHandlers,
} from "../factory/separate.js";
import {
    SeparateWebhookHandlerFactory,
} from "../factory/separate.js";
import {WebhookHandlerChain} from "../handler/chain.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createDefaultSeparateWebhookHandler(
    extensionStorage: ExtensionStorage,
    extensionId: string,
): SeparateWebhookHandlers {
    return new SeparateWebhookHandlerFactory(extensionStorage, extensionId).build();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createCustomSeparateWebhookHandler(
    extensionStorage: ExtensionStorage,
    extensionId: string,
): SeparateWebhookHandlers {
    return new SeparateWebhookHandlerFactory(extensionStorage, extensionId)
        .withoutLogging()
        .withoutWebhookSignatureVerification()
        .withWebhookHandlerPrefix({
            handleWebhook: async (webhookContent, next) => {
                console.log(
                    "This is gonna be called before every other webhook handler",
                );
                return next(webhookContent);
            },
        })
        .withWebhookHandlerSuffix(
            {
                handleWebhook: async (webhookContent, next) => {
                    console.log(
                        "This is gonna be called after every other webhook handler",
                    );
                    return next(webhookContent);
                },
            },
            {
                handleWebhook: async (webhookContent, next) => {
                    console.log(
                        "It was a lie! This is gonna be called after every other webhook handler",
                    );
                    return next(webhookContent);
                },
            },
        )
        .build();
}

function createCustomSeparateWebhookHandlerWithHandlerForAdded(
    extensionStorage: ExtensionStorage,
    extensionId: string,
): SeparateWebhookHandlers {
    const handlers =  new SeparateWebhookHandlerFactory(extensionStorage, extensionId).build();

    handlers.ExtensionAddedToContext = WebhookHandlerChain
        .fromHandlerFunctions(
            handlers.ExtensionAddedToContext,
            async (webhookContent) => {
                console.log("This is only gonna be called for ExtensionAddedToContext");
            },
        ).handleWebhook;

    return handlers;
}
