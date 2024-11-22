import type { Logger } from "../logging/interface.js";
import { ConsoleLogger } from "../logging/consoleLogger.js";
import type { ExtensionStorage } from "../storage/extensionStorage.js";
import { WebhookHandlerChain } from "../handler/chain.js";
import type { WebhookHandler } from "../handler/interface.js";
import { NoopLogger } from "../logging/noopLogger.js";
import {
    APIPublicKeyProvider,
    CachingPublicKeyProvider,
} from "../verification/publicKeys.js";
import { WebhookVerifier } from "../verification/verify.js";
import { LoggingWebhookHandler } from "../handler/logging.js";
import { VerifyingWebhookHandler } from "../handler/verification.js";
import {ExtensionIDVerificationWebhookHandler} from "../handler/extensionId.js";

export abstract class BaseWebhookHandlerFactory {
    protected logger: Logger = new ConsoleLogger();
    protected readonly extensionStorage: ExtensionStorage;
    protected readonly extensionID: string;
    protected baseHandlerChain: WebhookHandlerChain = new WebhookHandlerChain();
    protected handlerChainSuffix: WebhookHandler[] = [];
    protected verifyWebhookSignature = true;
    protected mittwaldAPIURL: string | undefined;

    protected constructor(extensionStorage: ExtensionStorage, extensionID: string) {
        this.extensionStorage = extensionStorage;
        this.extensionID = extensionID;
    }

    public withLogger(logger: Logger): this {
        this.logger = logger;
        return this;
    }

    public withoutLogging(): this {
        this.logger = new NoopLogger();
        return this;
    }

    public withMittwaldAPIURL(url: string): this {
        this.mittwaldAPIURL = url;
        return this;
    }

    public withWebhookHandlerPrefix(
        ...additionalHandlers: WebhookHandler[]
    ): this {
        this.baseHandlerChain = this.baseHandlerChain.withAdditionalHandlers(
            ...additionalHandlers,
        );
        return this;
    }

    public withWebhookHandlerSuffix(
        ...additionalHandlers: WebhookHandler[]
    ): this {
        this.handlerChainSuffix.push(...additionalHandlers);
        return this;
    }

    public withoutWebhookSignatureVerification(): this {
        this.verifyWebhookSignature = false;
        return this;
    }

    protected buildWebhookVerifier(): WebhookVerifier {
        const publicKeyProvider = new CachingPublicKeyProvider(
            APIPublicKeyProvider.newWithUnauthenticatedAPIClient(this.mittwaldAPIURL)
        );

        return new WebhookVerifier(this.logger, publicKeyProvider);
    }
    protected appendHandlerChainSuffix(): WebhookHandlerChain {
        return this.baseHandlerChain.withAdditionalHandlers(
            ...this.handlerChainSuffix,
        );
    }

    protected appendDefaultWebhookHandler(): void {
        const webhookVerifier = this.buildWebhookVerifier();

        this.baseHandlerChain = this.baseHandlerChain.withAdditionalHandlers(
            new LoggingWebhookHandler(this.logger),
            new ExtensionIDVerificationWebhookHandler(this.extensionID, this.logger),
        );

        if (this.verifyWebhookSignature) {
            this.baseHandlerChain =
                this.baseHandlerChain.withAdditionalHandlers(
                    new VerifyingWebhookHandler(webhookVerifier, this.logger),
                );
        }
    }
}
