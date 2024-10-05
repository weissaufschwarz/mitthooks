import type { Logger } from "./interface.js";

export class ConsoleLogger implements Logger {
    public info(message: string): void {
        console.log(message);
    }

    public debug(message: string): void {
        console.log(message);
    }

    public error(message: string): void {
        console.error(message);
    }
}
