import { WebhookContent } from "../webhook.js";

export const replacementString = "redacted";

export function redactSecretFromWebhookContent(
    webhookContent: WebhookContent,
): WebhookContent {
    const { rawBody, ...rest } = webhookContent;
    const parsedBody = JSON.parse(rawBody);
    const { secret, ...restBody } = parsedBody;

    if (secret) {
        restBody.secret = replacementString;
    }

    return {
        ...rest,
        rawBody: JSON.stringify(restBody),
    };
}
