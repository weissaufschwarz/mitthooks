import type { Logger } from "../logging/interface.js";
import type { PublicKeyProvider } from "./publicKeys.js";
import type { WebhookContent } from "../webhook.js";
import {
    MissingBodyError,
    MissingSignatureAlgorithmError,
    MissingSignatureError,
    MissingSignatureSerialError,
    UnknownSignatureAlgorithmError,
} from "../errors.js";
import { Ed25519SignatureVerificationStrategy } from "./ed25519.js";

export enum SignatureVerificationStrategyType {
    ED25519 = "ed25519",
}

export interface SignatureVerificationStrategy {
    verify: (
        signatureBuffer: Buffer,
        bodyBuffer: Buffer,
        publicKeyBuffer: Buffer,
    ) => Promise<boolean>;
}

export class WebhookVerifier {
    private readonly logger: Logger;
    private readonly publicKeyProvider: PublicKeyProvider;
    private readonly signatureVerificationStrategyMap: Record<
        SignatureVerificationStrategyType,
        SignatureVerificationStrategy
    >;

    public constructor(logger: Logger, publicKeyProvider: PublicKeyProvider) {
        this.logger = logger;
        this.publicKeyProvider = publicKeyProvider;
        this.signatureVerificationStrategyMap = {
            [SignatureVerificationStrategyType.ED25519]:
                new Ed25519SignatureVerificationStrategy(),
        };
    }

    public async verify(request: WebhookContent): Promise<boolean> {
        this.assertValidRequest(request);
        const { rawBody, signatureSerial, signatureAlgorithm, signature } =
            request;

        const publicKey =
            await this.publicKeyProvider.getPublicKey(signatureSerial);

        const signatureBuffer = Buffer.from(signature, "base64");
        const bodyBuffer = Buffer.from(rawBody, "utf8");
        const publicKeyBuffer = Buffer.from(publicKey, "base64");

        const lowercasedSignatureAlgorithm = signatureAlgorithm.toLowerCase();

        if (!(lowercasedSignatureAlgorithm in this.signatureVerificationStrategyMap)) {
            throw new UnknownSignatureAlgorithmError(signatureAlgorithm);
        }

        return this.signatureVerificationStrategyMap[
            lowercasedSignatureAlgorithm as SignatureVerificationStrategyType
        ].verify(signatureBuffer, bodyBuffer, publicKeyBuffer);
    }

    private assertValidRequest(request: WebhookContent): void {
        const { rawBody, signatureSerial, signatureAlgorithm, signature } =
            request;
        if (!signature) {
            this.logger.error("Missing signature in request");
            throw new MissingSignatureError();
        }

        if (!signatureSerial) {
            this.logger.error("Missing signature serial in request");
            throw new MissingSignatureSerialError();
        }

        if (!signatureAlgorithm) {
            this.logger.error("Missing signature algorithm in request");
            throw new MissingSignatureAlgorithmError();
        }

        if (!rawBody) {
            this.logger.error("Missing body in request");
            throw new MissingBodyError();
        }
    }
}
