import type { HandleWebhook } from "../handler/interface.js";
import type { WebhookContent } from "../webhook.js";
import { AbstractWebhookHandlingWrapper } from "./abstract-wrapper.js";

export class HttpWebhookHandler extends AbstractWebhookHandlingWrapper {
    public constructor(handleWebhook: HandleWebhook) {
        super(handleWebhook);
    }

    protected async getWebhookContent(
        request: Request,
    ): Promise<WebhookContent> {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const signatureSerial =
            request.headers.get("X-Marketplace-Signature-Serial") || "";
        const signatureAlgorithm =
            request.headers.get("X-Marketplace-Signature-Algorithm") || "";
        const signature = request.headers.get("X-Marketplace-Signature") || "";

        let rawBody;
        try {
            rawBody = await request.text();
        } catch (e) {
            throw new Error(
                `Failed to read request body: ${(e as Error).toString()}`,
            );
        }

        return {
            rawBody,
            signatureSerial,
            signatureAlgorithm,
            signature,
        };
    }
}
