# mitthooks

This package contains the SDK for handling lifecycle webhooks and factories, helping to instantiate the necessary classes.
The SDK is designed to be very modular and extensible, so you can easily add new features or bootstrap it only with your required features.
Under normal circumstances, you should not need to bootstrap the SDK manually, as there are factories, which should be suitable for most cases.

## Features

* **Signature Verification** - Verify the signature of the incoming webhook request to ensure it is from the mittwald mStudio
* **Extension ID Verification** - Verify the extension ID of the incoming webhook request to ensure it is from the correct extension to protect against forward replay attacks.
* **Easy to implement Extension Instance Storage Interface** - Use your own storage implementation to store extension instances.
* **Custom Webhook Handlers** - Hang your own handler middlewares in the webhook handler chain.
* **No requirement to use a specific web framework** - This SDK is framework-agnostic, so you can use it with any web framework (Express, Next.js, etc.)
* **Logging** - Log the incoming webhook request

* **Combined Handler** - One function to handle all the lifecycle webhooks
* **Separate Handlers** - Separate functions for each lifecycle webhook

## Webhook Handlers

A webhook handler is an object implementing the [following interface](./src/handler/interface.ts):

```typescript
export interface WebhookHandler {
    handleWebhook: (
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ) => Promise<void>;
}
```

The `handleWebhook` function is the main function that will be called when a webhook is received.
It receives the webhook content and a `next` function, which should be called to pass the webhook to the next handler in the chain.

## Factories

The factories are located in the [src/factory](./src/factory) directory.

### Combined Handler Factory

The CombinedWebhookHandlerFactory is a factory that creates a single handler capable of handling all the lifecycle webhooks.
You should use this factory, if you don't have to implement custom handlers for a specific lifecycle webhook.

It can be used like this: 

```typescript
import type { ExtensionStorage } from "@weissaufschwarz/mitthooks/storage/extensionStorage.js";
import { CombinedWebhookHandlerFactory } from "@weissaufschwarz/mitthooks/factory/combined.js";
import type { HandleWebhook } from "@weissaufschwarz/mitthooks/handler/interface.js";

function createDefaultCombinedWebhookHandler(
    extensionStorage: ExtensionStorage,
    extensionId: string,
): HandleWebhook {
    return new CombinedWebhookHandlerFactory(extensionStorage, extensionId).build();
}
```

The following example shows more advanced customizations:

```typescript
import type { ExtensionStorage } from "@weissaufschwarz/mitthooks/storage/extensionStorage.js";
import { CombinedWebhookHandlerFactory } from "@weissaufschwarz/mitthooks/factory/combined.js";
import type { HandleWebhook } from "@weissaufschwarz/mitthooks/handler/interface.js";

function createCustomCombinedWebhookHandler(
    extensionStorage: ExtensionStorage,
    extensionId: string
): HandleWebhook {
    return new CombinedWebhookHandlerFactory(extensionStorage, extensionId)
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
```

`withWebhookHandlerPrefix` adds a handler that will be called **before** every other handler.
It can be called multiple times to add multiple handlers.
`withWebhookHandlerSuffix` adds a handler that will be called **after** every other handler.
It can be called multiple times to add multiple handlers.

If you call `withWebhookHandlerSuffix(handler1, handler2).withWebhookHandlerSuffix(handler3)`, the order of the handlers will be `handler1`, `handler2`, [defaultHandlers], `handler3`.


### Separate Handler Factory

The SeparateWebhookHandlerFactory is a factory that creates separate handlers for each lifecycle webhook.
You should use this factory, if you have to implement custom handlers for a specific lifecycle webhook.

It can be used like this:

```typescript
import type { ExtensionStorage } from "@weissaufschwarz/mitthooks/storage/extensionStorage.js";
import type {
    SeparateWebhookHandlers,
} from "@weissaufschwarz/mitthooks/factory/separate.js";
import {
    SeparateWebhookHandlerFactory,
} from "@weissaufschwarz/mitthooks/factory/separate.js";

function createDefaultSeparateWebhookHandler(
    extensionStorage: ExtensionStorage,
    extensionId: string,
): SeparateWebhookHandlers {
    return new SeparateWebhookHandlerFactory(extensionStorage, extensionId).build();
}
```

The following example shows more advanced customizations:

```typescript
import type { ExtensionStorage } from "@weissaufschwarz/mitthooks/storage/extensionStorage.js";
import type {
    SeparateWebhookHandlers,
} from "@weissaufschwarz/mitthooks/factory/separate.js";
import {
    SeparateWebhookHandlerFactory,
} from "@weissaufschwarz/mitthooks/factory/separate.js";

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
```

As with the CombinedWebhookHandlerFactory, `withWebhookHandlerPrefix` adds a handler that will be called **before** every other handler of every lifecycle webhook.
It can be called multiple times to add multiple handlers.
`withWebhookHandlerSuffix` adds a handler that will be called **after** every other handler of every lifecycle webhook.
It can be called multiple times to add multiple handlers.

If you call `withWebhookHandlerSuffix(handler1, handler2).withWebhookHandlerSuffix(handler3)`, the order of the handlers will be `handler1`, `handler2`, [defaultHandlers], `handler3`.

To add a handler just for a specific lifecycle webhook, you can just use the `WebhookHandlerChain` that is also used internally.

```typescript
import type { ExtensionStorage } from "@weissaufschwarz/mitthooks/storage/extensionStorage.js";
import type {
    SeparateWebhookHandlers,
} from "@weissaufschwarz/mitthooks/factory/separate.js";
import {
    SeparateWebhookHandlerFactory,
} from "@weissaufschwarz/mitthooks/factory/separate.js";
import {WebhookHandlerChain} from "@weissaufschwarz/mitthooks/handler/chain.js";

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
```

## ExtensionStorage

The `ExtensionStorage` is an interface that you have to implement to store the extension instances.
The interface is located in the [src/storage/extensionStorage.ts](./src/storage/extensionStorage.ts) file.

Consider reading the [Lifecycle Webhook Concepts documentation](https://developer.mittwald.de/docs/v2/contribution/overview/concepts/lifecycle-webhooks/) 
and the [Lifecycle Webhook Reference documentation](https://developer.mittwald.de/docs/v2/contribution/reference/webhooks/)
to understand the lifecycle webhooks and the data that is sent with them.

```typescript

export interface ExtensionStorage {
    upsertExtension: (extension: ExtensionToBeAdded) => Promise<void> | void;
    updateExtension: (extension: ExtensionToBeUpdated) => Promise<void> | void;
    rotateSecret: (
        extensionInstanceId: string,
        secret: string,
    ) => Promise<void> | void;
    removeInstance: (extensionInstanceId: string) => Promise<void> | void;
}
```

The `upsertExtension` function is called for a `ExtensionAddedToContext` lifecycle webhook. As documented, webhooks should be idempotent, 
so the implementation of the interface should not throw an error if the extension is already stored.

The `updateExtension` function is called for an `InstanceUpdated` lifecycle webhook. In contrast to the `upsertExtension` function,
this webhook does not deliver a secret.
 
The `rotateSecret` function is called for a `SecretRotated` lifecycle webhook. As the name suggests, this webhook delivers a new secret for the extension instance.
The old secret is not valid anymore.

The `removeInstance` function is called for an `InstanceRemovedFromContext` lifecycle webhook. This webhook is called when the extension instance is removed from the context.
Currently, you cannot tidy up mStudio resources in this function, as the secret (and therefore access tokens) are not valid anymore.
