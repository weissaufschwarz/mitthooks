import {headers} from "next/headers.js";
import type {WebhookContent} from "@weissaufschwarz/mitthooks/webhook";
import {AbstractWebhookHandlingWrapper} from "@weissaufschwarz/mitthooks/bootstrapping/abstract-wrapper";

export class NextJSWebhookHandler extends AbstractWebhookHandlingWrapper {
    protected async getWebhookContent(request: Request): Promise<WebhookContent> {
        // eslint-disable-next-line @typescript-eslint/await-thenable
        const headersList = await headers();
        const signatureSerial = this.getHeader(
            headersList,
            "x-marketplace-signature-serial",
        );
        const signatureAlgorithm = this.getHeader(
            headersList,
            "x-marketplace-signature-algorithm",
        );
        const signature = this.getHeader(headersList, "x-marketplace-signature");

        let rawBody;
        try {
            rawBody = await request.text();
        } catch (e) {
            throw new Error(`Failed to read request body: ${(e as Error).toString()}`);
        }

        return {
            rawBody,
            signatureSerial,
            signatureAlgorithm,
            signature,
        };
    }

    private getHeader = (headersList: Headers, headerName: string): string => {
        return headersList.get(headerName) ?? "";
    };
}
