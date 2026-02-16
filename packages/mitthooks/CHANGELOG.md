# @weissaufschwarz/mitthooks

## 0.3.1

### Patch Changes

- 5a07655: documented how to use the HttpWebhookHandler
- 63c4e5d: made import parts of mitthooks more accessible to import

## 0.3.0

### Minor Changes

- 6dda834: added a generic http wrapper for mitthooks to be used for raw http
  servers, tanstack router, etc.

## 0.2.2

### Patch Changes

- 6f75111: redact extension instance secret before logging

## 0.2.1

### Patch Changes

- 2012080: BUGFIX: ignore casing of used webhook signature algorithm
- 534ce88: FEATURE: allow webhook handler without promises

## 0.2.0

### Minor Changes

- 277247b: Add verification of extension instance ID in default webhook handler
  chain to be able to prevent forward replay attacks

## 0.1.0

### Minor Changes

- b0cbcaa: Initially publish mitthooks and mitthooks-nextjs
