import { headers } from "next/headers.js";
import type { HandleWebhook } from "@weissaufschwarz/mitthooks/handler/interface";
import * as errorTypes from "@weissaufschwarz/mitthooks/errors";
import type { WebhookContent } from "@weissaufschwarz/mitthooks/webhook";

export class NextJSWebhookHandler {
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

    private getHeader = (headersList: Headers, headerName: string): string => {
        return headersList.get(headerName) ?? "";
    };

    private async getWebhookContent(request: Request): Promise<WebhookContent> {
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
