import { customType } from "drizzle-orm/pg-core";
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from "node:crypto";

const algorithm = "aes-256-gcm";
const IV_LEN = 12;

export function buildEncryptionKey(
    masterPassword: string,
    salt: string,
): Buffer {
    return scryptSync(masterPassword, salt, 32);
}

export const buildEncryptedTextColumn = (encryptionKey: Buffer) => {
    return customType<{ data: string }>({
        dataType() {
            return "text";
        },
        fromDriver(value: unknown) {
            if (typeof value !== "string")
                throw new Error("Invalid encrypted value");

            const [ivB64, encB64, tagB64] = value.split(":");

            if (!ivB64 || !encB64 || !tagB64) {
                throw new Error("Invalid encrypted value");
            }

            const iv = Buffer.from(ivB64, "base64");
            const encrypted = Buffer.from(encB64, "base64");
            const tag = Buffer.from(tagB64, "base64");

            const decipher = createDecipheriv(algorithm, encryptionKey, iv);
            decipher.setAuthTag(tag);

            const decrypted = Buffer.concat([
                decipher.update(encrypted),
                decipher.final(),
            ]);
            return decrypted.toString("utf8");
        },
        toDriver(value: string) {
            const initializationVektor = randomBytes(IV_LEN);
            const cipher = createCipheriv(
                algorithm,
                encryptionKey,
                initializationVektor,
            );

            const encrypted = Buffer.concat([
                cipher.update(value, "utf8"),
                cipher.final(),
            ]);
            const tag = cipher.getAuthTag();

            return [initializationVektor, encrypted, tag]
                .map((buf) => buf.toString("base64"))
                .join(":");
        },
    });
};

export type EncryptedTextColumn = ReturnType<typeof buildEncryptedTextColumn>;
