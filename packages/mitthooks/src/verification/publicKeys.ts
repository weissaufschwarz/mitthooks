import { MittwaldAPIV2Client } from "@mittwald/api-client";
import { FailedToFetchPublicKey } from "../errors.js";

export interface PublicKeyProvider {
    getPublicKey: (serial: string) => Promise<string> | string;
}

export class APIPublicKeyProvider implements PublicKeyProvider {
    private readonly apiClient: MittwaldAPIV2Client;

    private constructor(apiClient: MittwaldAPIV2Client) {
        this.apiClient = apiClient;
    }

    public static newWithUnauthenticatedAPIClient(mittwaldApiUrl?: string): APIPublicKeyProvider {
        const apiClient = MittwaldAPIV2Client.newUnauthenticated();

        if (mittwaldApiUrl) {
            apiClient.axios.defaults.baseURL = mittwaldApiUrl;
        }

        return new APIPublicKeyProvider(apiClient);
    }

    public async getPublicKey(serial: string): Promise<string> {
        const response = await this.apiClient.marketplace.extensionGetPublicKey(
            {
                serial: serial,
            },
        );
        if (response.status !== 200) {
            throw new FailedToFetchPublicKey(serial, response.status);
        }
        return response.data.key;
    }
}

export class CachingPublicKeyProvider implements PublicKeyProvider {
    private readonly delegate: PublicKeyProvider;
    private readonly cache: Map<string, string>;

    public constructor(delegate: PublicKeyProvider) {
        this.delegate = delegate;
        this.cache = new Map();
    }

    public async getPublicKey(serial: string): Promise<string> {
        const cacheHit = this.cache.get(serial);
        if (cacheHit) {
            return cacheHit;
        }
        const publicKey = await this.delegate.getPublicKey(serial);
        this.cache.set(serial, publicKey);
        return publicKey;
    }
}
