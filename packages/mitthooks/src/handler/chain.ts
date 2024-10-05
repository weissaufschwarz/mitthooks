import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { WebhookContent } from "../webhook.js";

export class WebhookHandlerChain implements WebhookHandler {
    private readonly handlers: WebhookHandler[];
    public constructor(...handlers: WebhookHandler[]) {
        this.handlers = handlers;
    }

    public withAdditionalHandlers(
        ...additionalHandlers: WebhookHandler[]
    ): WebhookHandlerChain {
        return new WebhookHandlerChain(...this.handlers, ...additionalHandlers);
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next?: HandleWebhook,
    ): Promise<void> {
        const dispatch = async (
            index: number,
            dispatchedWebhookContent: WebhookContent,
        ): Promise<void> => {
            if (index < this.handlers.length) {
                const handler = this.handlers[index];
                if (!handler) {
                    throw new Error("Handler is undefined, this is unexpected");
                }
                await handler.handleWebhook(
                    dispatchedWebhookContent,
                    async (newWebhookContent) => {
                        await dispatch(index + 1, newWebhookContent);
                    },
                );
            } else {
                next && (await next(dispatchedWebhookContent));
            }
        };

        await dispatch(0, webhookContent);
    }
}
