import type { HandleWebhook, WebhookHandler } from "./interface.js";
import type { Logger } from "../logging/interface.js";
import { LogLevel } from "../logging/interface.js";
import type { WebhookContent } from "../webhook.js";

export class LoggingWebhookHandler implements WebhookHandler {
    private readonly logger: Logger;
    private readonly logLevel: LogLevel;

    public constructor(logger: Logger, logLevel: LogLevel = LogLevel.DEBUG) {
        this.logger = logger;
        this.logLevel = logLevel;
    }

    public async handleWebhook(
        webhookContent: WebhookContent,
        next: HandleWebhook,
    ): Promise<void> {
        this.logger[this.logLevel](
            `Handling webhook: ${JSON.stringify(webhookContent)}`,
        );
        return next(webhookContent);
    }
}
