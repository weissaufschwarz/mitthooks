/* eslint-disable @typescript-eslint/no-empty-function */
import type { Logger } from "./interface.js";

export class NoopLogger implements Logger {
    public info(): void {}

    public debug(): void {}

    public error(): void {}
}
