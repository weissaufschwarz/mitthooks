import type { HandleWebhook } from "../handler/interface.js";
import type { WebhookContent } from "../webhook.js";
import * as errorTypes from "../errors.js";

export abstract class AbstractWebhookHandlingWrapper {
    private readonly delegate: HandleWebhook;
    public constructor(handleWebhook: HandleWebhook) {
        this.delegate = handleWebhook;
    }

    public async handleWebhook(request: Request): Promise<Response> {
        const webhookContent = await this.getWebhookContent(request);

        try {
            await this.delegate(webhookContent);
        } catch (e) {
            return this.handleWebhookHandlerError(e as Error);
        }

        return new Response("Webhook handled successfully", {
            status: 200,
        });
    }

    protected abstract getWebhookContent(
        request: Request,
    ): Promise<WebhookContent>;

    private handleWebhookHandlerError(e: Error): Response {
        if (
            this.isErrorInstanceOfAnyOf(
                e,
                errorTypes.UnknownSignatureAlgorithmError,
                errorTypes.FailedToFetchPublicKey,
            )
        ) {
            return new Response(e.message, {
                status: 500,
            });
        }

        if (
            this.isErrorInstanceOfAnyOf(
                e,
                errorTypes.MissingBodyError,
                errorTypes.MissingSignatureError,
                errorTypes.MissingSignatureSerialError,
                errorTypes.MissingSignatureAlgorithmError,
                errorTypes.InvalidBodyError,
            )
        ) {
            return new Response(e.message, {
                status: 400,
            });
        }

        console.error("Unknown error occured", e);
        return new Response("Unknown error occured", {
            status: 500,
        });
    }

    private isErrorInstanceOfAnyOf(
        error: Error,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...thingsToCompareWith: any[]
    ): boolean {
        for (const errorToCompareWith of thingsToCompareWith) {
            if (error instanceof errorToCompareWith) {
                return true;
            }
        }

        return false;
    }
}
