export class MissingSignatureError extends Error {
    public constructor() {
        super("MissingSignatureError");
    }
}

export class MissingSignatureSerialError extends Error {
    public constructor() {
        super("MissingSignatureSerialError");
    }
}

export class MissingSignatureAlgorithmError extends Error {
    public constructor() {
        super("MissingSignatureAlgorithmError");
    }
}

export class MissingBodyError extends Error {
    public constructor() {
        super("MissingBodyError");
    }
}

export class InvalidBodyError extends Error {
    public constructor(errorMessage: string) {
        super(errorMessage);
    }
}

export class FailedToFetchPublicKey extends Error {
    public constructor(serial: string, status: number) {
        super(
            `Failed to fetch public key for serial ${serial} with status ${status.toString()}`,
        );
    }
}

export class UnknownSignatureAlgorithmError extends Error {
    public constructor(signatureAlgorithm: string) {
        super(`Unknown signature algorithm: ${signatureAlgorithm}`);
    }
}
