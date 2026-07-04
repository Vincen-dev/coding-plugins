export interface CommandDefinition {
    name: string;
    script: string;
    usage: string;
}
export declare const COMMAND_REGISTRY: {
    name: string;
    script: string;
    usage: string;
}[];
export declare function commandByName(name: string): CommandDefinition | undefined;
