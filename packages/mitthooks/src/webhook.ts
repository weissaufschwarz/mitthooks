export interface WebhookContent {
    rawBody: string;
    signatureSerial: string;
    signatureAlgorithm: string;
    signature: string;
}
