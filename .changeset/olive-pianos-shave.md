---
"@weissaufschwarz/mitthooks": patch
---

fixed webhook signature verification being ineffective

`VerifyingWebhookHandler` awaited the verifier but discarded its result, so the
chain only stopped when verification *threw*. `@noble/ed25519` resolves to
`false` for a signature mismatch instead of throwing, which meant any request
carrying well-formed signature headers was forwarded to the handler chain as if
it had been verified. The handler now rejects with `InvalidSignatureError`
unless verification explicitly returns `true`.
