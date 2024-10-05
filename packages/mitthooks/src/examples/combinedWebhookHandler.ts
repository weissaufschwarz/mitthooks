import type { ExtensionStorage } from "../storage/extensionStorage.js";
import { CombinedWebhookHandlerFactory } from "../factory/combined.js";
import type { HandleWebhook } from "../handler/interface.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createDefaultCombinedWebhookHandler(
    extensionStorage: ExtensionStorage,
): HandleWebhook {
    return new CombinedWebhookHandlerFactory(extensionStorage).build();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars,no-unused-vars
function createCustomCombinedWebhookHandler(
    extensionStorage: ExtensionStorage,
): HandleWebhook {
    return new CombinedWebhookHandlerFactory(extensionStorage)
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
