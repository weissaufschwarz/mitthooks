import { HandleWebhook, WebhookHandler } from "./interface.js";
import { WebhookContent } from "../webhook.js";
import { WebhookHandlerChain } from "./chain.js";

const fakeWebhookContent = {
    rawBody: "",
    signature: "",
    signatureAlgorithm: "",
    signatureSerial: "",
};

describe("WebhookHandlerChain", () => {
    it("should call handlers in order", async () => {
        const calls: number[] = [];

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(1);
                await next(webhookContent);
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(2);
                await next(webhookContent);
            },
        };

        const handler3: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(3);
                await next(webhookContent);
            },
        };

        const chain = new WebhookHandlerChain(handler1, handler2, handler3);

        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([1, 2, 3]);
    });

    it("can be nested", async () => {
        const calls: number[] = [];

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(1);
                await next(webhookContent);
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(2);
                await next(webhookContent);
            },
        };

        const handler3: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(3);
                await next(webhookContent);
            },
        };

        const innerChain = new WebhookHandlerChain(handler1, handler2);

        const chain = new WebhookHandlerChain(innerChain, handler3);

        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([1, 2, 3]);
    });

    it("should stop the chain if a handler does not call next", async () => {
        const calls: number[] = [];

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(1);
                // Does not call next
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(2);
                await next(webhookContent);
            },
        };

        const chain = new WebhookHandlerChain(handler1, handler2);
        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([1]);
    });

    it("should call final next when there are no handlers", async () => {
        const calls: number[] = [];

        const chain = new WebhookHandlerChain();
        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([]);
    });

    it("should pass modified webhookContent to next handlers", async () => {
        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                webhookContent.signatureSerial = "foo";
                await next(webhookContent);
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                expect(webhookContent.signatureSerial).toBe("foo");
                await next(webhookContent);
            },
        };

        const chain = new WebhookHandlerChain(handler1, handler2);

        await chain.handleWebhook(fakeWebhookContent);
    });

    it("should handle errors thrown in handlers", async () => {
        const error = new Error("Test error");

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                throw error;
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: vitest.fn(),
        };

        const chain = new WebhookHandlerChain(handler1, handler2);

        await expect(chain.handleWebhook(fakeWebhookContent)).rejects.toThrow(
            "Test error",
        );

        expect(handler2.handleWebhook).not.toHaveBeenCalled();
    });

    it("should allow handlers to modify and pass different webhookContent", async () => {
        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                const newContent: WebhookContent = {
                    ...webhookContent,
                    signatureSerial: "foo",
                };
                await next(newContent);
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                expect(webhookContent.signatureSerial).toBe("foo");
                const newContent: WebhookContent = {
                    ...webhookContent,
                    signatureAlgorithm: "bar",
                };
                await next(newContent);
            },
        };

        const handler3: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                expect(webhookContent.signatureSerial).toBe("foo");
                expect(webhookContent.signatureAlgorithm).toBe("bar");
                await next(webhookContent);
            },
        };

        const chain = new WebhookHandlerChain(handler1, handler2, handler3);

        await chain.handleWebhook(fakeWebhookContent);
    });

    it("should support asynchronous operations in handlers", async () => {
        const calls: number[] = [];

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                calls.push(1);
                await next(webhookContent);
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                calls.push(2);
                await next(webhookContent);
            },
        };

        const chain = new WebhookHandlerChain(handler1, handler2);
        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([1, 2]);
    });

    it("should work correctly when next is called multiple times", async () => {
        const calls: number[] = [];

        const handler1: WebhookHandler = {
            handleWebhook: async (
                webhookContent: WebhookContent,
                next: HandleWebhook,
            ) => {
                calls.push(1);
                await next(webhookContent);
                await next(webhookContent); // Calling next multiple times
            },
        };

        const handler2: WebhookHandler = {
            handleWebhook: vitest.fn(),
        };

        const chain = new WebhookHandlerChain(handler1, handler2);

        await chain.handleWebhook(fakeWebhookContent);

        expect(calls).toEqual([1]);
        expect(handler2.handleWebhook).toHaveBeenCalledTimes(2);
    });
});
