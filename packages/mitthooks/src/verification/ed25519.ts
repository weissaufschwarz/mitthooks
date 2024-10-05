import type { SignatureVerificationStrategy } from "./verify.js";
import { verifyAsync } from "@noble/ed25519";

export class Ed25519SignatureVerificationStrategy
    implements SignatureVerificationStrategy
{
    public verify(
        signatureBuffer: Buffer,
        bodyBuffer: Buffer,
        publicKeyBuffer: Buffer,
    ): Promise<boolean> {
        return verifyAsync(signatureBuffer, bodyBuffer, publicKeyBuffer);
    }
}
