# Nextjs Mitthooks Test Project

This package is make for manual testing purposes of the mitthooks package in combination with the mitthooks-next package.
To run it locally, follow the steps below:

1. `docker compose up -d` to start the local dev server of the mittwald marketplace
2. `pnpm run dev` to start the example nextjs project
3. `pnpm run test-webhooks` to run the test script, that executes every webhook once