# mitthooks

This library is in a very early stage of development. Usage in production is not recommended.

mitthooks is an SDK for handling [mittwald extension](https://developer.mittwald.de/docs/v2/contribution/) [lifecycle webhooks](https://developer.mittwald.de/docs/v2/contribution/overview/concepts/lifecycle-webhooks/).
Its target is to provide a simple and easy way to satisfy the requirements of handling lifecycle webhooks and security concerns of a mittwald contributor.

## Project structure

This repository contains multiple packages due to separation of concerns and modularity. The packages are:

- [`mitthooks`](./packages/mitthooks/README.md): The main package that contains the SDK for handling lifecycle webhooks and factories, helping to instantiate the necessary objects.
- [`mitthooks-nextjs`](./packages/mitthooks-next/README.md): A package that contains a wrapper for the mitthooks SDK to be used in Next.js app routes.
