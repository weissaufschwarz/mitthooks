export interface Extension {
    extensionInstanceId: string;
    contextId: string;
    consentedScopes: string[];
    secret: string;
    enabled: boolean;
    variantKey: string;
}

export type ExtensionToBeAdded = Pick<
    Extension,
    "extensionInstanceId" | "contextId" | "consentedScopes" | "secret" | "variantKey"
>;

export type ExtensionToBeUpdated = Pick<
    Extension,
    "extensionInstanceId" | "contextId" | "consentedScopes" | "enabled" | "variantKey"
>;

export interface ExtensionStorage {
    upsertExtension: (extension: ExtensionToBeAdded) => Promise<void> | void;
    updateExtension: (extension: ExtensionToBeUpdated) => Promise<void> | void;
    rotateSecret: (
        extensionInstanceId: string,
        secret: string,
    ) => Promise<void> | void;
    removeInstance: (extensionInstanceId: string) => Promise<void> | void;
}
