import { describe, expect, it } from "vitest";
import { WebhookContent } from "../webhook";
import {
    ExtensionAddedToContextWebhookBody,
    InstanceUpdatedWebhookBody,
} from "../schemas";
import { redactSecretFromWebhookContent, replacementString } from "./redaction";

describe("redactSecretFromWebhookContent", () => {
    it("should redact the secret from raw body", async () => {
        const secret = "mwes-foo";
        const body: ExtensionAddedToContextWebhookBody = {
            secret,
            id: "foo",
        };
        const webhookContent: WebhookContent = {
            rawBody: JSON.stringify(body),
            signatureAlgorithm: "foo",
            signature: "bar",
            signatureSerial: "baz",
        };

        const expectedBody: ExtensionAddedToContextWebhookBody = {
            secret: "redacted",
            id: "foo",
        };

        const actualRedactedWebhookContent =
            redactSecretFromWebhookContent(webhookContent);

        expect(actualRedactedWebhookContent.rawBody).not.contains(secret);
        expect(actualRedactedWebhookContent.rawBody).contains(
            replacementString,
        );

        const actualBody = JSON.parse(actualRedactedWebhookContent.rawBody);

        expect(actualBody).toEqual(expectedBody);
        expect(actualRedactedWebhookContent.signatureAlgorithm).toEqual(
            webhookContent.signatureAlgorithm,
        );
        expect(actualRedactedWebhookContent.signature).toEqual(
            webhookContent.signature,
        );
        expect(actualRedactedWebhookContent.signatureSerial).toEqual(
            webhookContent.signatureSerial,
        );

        expect(webhookContent.rawBody).contains(secret);
    });

    it("does not add secret to the redacted body if it is not present", async () => {
        const body: InstanceUpdatedWebhookBody = {
            id: "foo",
        };
        const webhookContent: WebhookContent = {
            rawBody: JSON.stringify(body),
            signatureAlgorithm: "foo",
            signature: "bar",
            signatureSerial: "baz",
        };

        const redactedWebhookContent =
            redactSecretFromWebhookContent(webhookContent);
        expect(redactedWebhookContent.rawBody).not.contains("secret");
        expect(redactedWebhookContent.rawBody).not.contains(replacementString);
    });
});
