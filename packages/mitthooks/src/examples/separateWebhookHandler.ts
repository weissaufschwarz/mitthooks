import type { ExtensionStorage } from "../storage/extensionStorage.js";
import type {
    SeparateWebhookHandlers,
} from "../factory/separate.js";
import {
    SeparateWebhookHandlerFactory,
} from "../factory/separate.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createDefaultSeparateWebhookHandler(
    extensionStorage: ExtensionStorage,
): SeparateWebhookHandlers {
    return new SeparateWebhookHandlerFactory(extensionStorage).build();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createCustomSeparateWebhookHandler(
    extensionStorage: ExtensionStorage,
): SeparateWebhookHandlers {
    return new SeparateWebhookHandlerFactory(extensionStorage)
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