import { getPublicKeyAsync, signAsync, utils } from "@noble/ed25519";
import { VerifyingWebhookHandler } from "./verification.js";
import { WebhookVerifier } from "../verification/verify.js";
import type { PublicKeyProvider } from "../verification/publicKeys.js";
import type { WebhookContent } from "../webhook.js";
import { NoopLogger } from "../logging/noopLogger.js";
import { InvalidSignatureError, MissingSignatureError } from "../errors.js";

const logger = new NoopLogger();

const webhookContent: WebhookContent = {
    rawBody: '{"hello":"world"}',
    signature: "irrelevant-for-the-stubbed-verifier",
    signatureAlgorithm: "ed25519",
    signatureSerial: "serial-1",
};

/**
 * Minimal stand-in for WebhookVerifier, so the handler's handling of the
 * verification *result* can be tested independently of the crypto.
 */
const stubVerifier = (
    verify: (content: WebhookContent) => Promise<boolean>,
): WebhookVerifier => ({ verify }) as unknown as WebhookVerifier;

describe("VerifyingWebhookHandler", () => {
    it("should call next when the signature is valid", async () => {
        const next = vitest.fn();
        const handler = new VerifyingWebhookHandler(
            stubVerifier(() => Promise.resolve(true)),
            logger,
        );

        await handler.handleWebhook(webhookContent, next);

        expect(next).toHaveBeenCalledWith(webhookContent);
    });

    it("should throw and not call next when verification returns false", async () => {
        const next = vitest.fn();
        const handler = new VerifyingWebhookHandler(
            stubVerifier(() => Promise.resolve(false)),
            logger,
        );

        await expect(
            handler.handleWebhook(webhookContent, next),
        ).rejects.toThrow(InvalidSignatureError);

        expect(next).not.toHaveBeenCalled();
    });

    it("should throw and not call next when verification throws", async () => {
        const next = vitest.fn();
        const handler = new VerifyingWebhookHandler(
            stubVerifier(() => Promise.reject(new MissingSignatureError())),
            logger,
        );

        await expect(
            handler.handleWebhook(webhookContent, next),
        ).rejects.toThrow(MissingSignatureError);

        expect(next).not.toHaveBeenCalled();
    });

    it("should not treat a non-boolean truthy verification result as valid", async () => {
        const next = vitest.fn();
        const handler = new VerifyingWebhookHandler(
            // Untyped consumers (or a custom verifier) could return something
            // other than a boolean; only an explicit `true` may pass.
            stubVerifier(() => Promise.resolve("yes" as unknown as boolean)),
            logger,
        );

        await expect(
            handler.handleWebhook(webhookContent, next),
        ).rejects.toThrow(InvalidSignatureError);

        expect(next).not.toHaveBeenCalled();
    });
});

describe("VerifyingWebhookHandler with real ed25519 signatures", () => {
    const rawBody = '{"meta":{"extensionId":"ext-1"}}';
    const serial = "serial-1";

    let publicKeyBase64: string;
    let validSignatureBase64: string;
    let handler: VerifyingWebhookHandler;

    beforeAll(async () => {
        const privateKey = utils.randomPrivateKey();
        const publicKey = await getPublicKeyAsync(privateKey);
        publicKeyBase64 = Buffer.from(publicKey).toString("base64");

        const signature = await signAsync(
            Buffer.from(rawBody, "utf8"),
            privateKey,
        );
        validSignatureBase64 = Buffer.from(signature).toString("base64");

        const publicKeyProvider: PublicKeyProvider = {
            getPublicKey: () => publicKeyBase64,
        };
        handler = new VerifyingWebhookHandler(
            new WebhookVerifier(logger, publicKeyProvider),
            logger,
        );
    });

    it("should accept a correctly signed webhook", async () => {
        const next = vitest.fn();

        await handler.handleWebhook(
            {
                rawBody,
                signature: validSignatureBase64,
                signatureAlgorithm: "ed25519",
                signatureSerial: serial,
            },
            next,
        );

        expect(next).toHaveBeenCalled();
    });

    it("should reject a well-formed but invalid signature", async () => {
        const next = vitest.fn();

        // 64 bytes, i.e. the correct length for an ed25519 signature. Anything
        // shorter makes @noble/ed25519 throw, which masks the actual problem:
        // a wrong-but-well-formed signature resolves to `false` instead.
        const invalidSignature = Buffer.alloc(64, 1).toString("base64");

        await expect(
            handler.handleWebhook(
                {
                    rawBody,
                    signature: invalidSignature,
                    signatureAlgorithm: "ed25519",
                    signatureSerial: serial,
                },
                next,
            ),
        ).rejects.toThrow(InvalidSignatureError);

        expect(next).not.toHaveBeenCalled();
    });

    it("should reject a valid signature for a tampered body", async () => {
        const next = vitest.fn();

        await expect(
            handler.handleWebhook(
                {
                    rawBody: '{"meta":{"extensionId":"attacker"}}',
                    signature: validSignatureBase64,
                    signatureAlgorithm: "ed25519",
                    signatureSerial: serial,
                },
                next,
            ),
        ).rejects.toThrow(InvalidSignatureError);

        expect(next).not.toHaveBeenCalled();
    });

    it("should reject a signature made with a different key", async () => {
        const next = vitest.fn();

        const attackerKey = utils.randomPrivateKey();
        const attackerSignature = Buffer.from(
            await signAsync(Buffer.from(rawBody, "utf8"), attackerKey),
        ).toString("base64");

        await expect(
            handler.handleWebhook(
                {
                    rawBody,
                    signature: attackerSignature,
                    signatureAlgorithm: "ed25519",
                    signatureSerial: serial,
                },
                next,
            ),
        ).rejects.toThrow(InvalidSignatureError);

        expect(next).not.toHaveBeenCalled();
    });
});
