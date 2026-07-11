import type { ActiveChangeRecord } from "../workflow/active-change.ts";
import type { UserFlow } from "../workflow/route-decision.ts";
export type ArtifactProfile = "none" | "quick" | "standard" | "governed";
export declare function selectArtifactProfile(options: {
    flow: UserFlow;
    multiTurn?: boolean;
}): ArtifactProfile;
export declare function parseStandardChangeDocument(text: string): ActiveChangeRecord | null;
export declare function renderStandardChangeDocument(record: ActiveChangeRecord): string;
export declare function validateStandardChangeDocument(text: string): string[];
export declare function standardChangeDocumentPath(root: string, changeId: string): string;
export declare function writeStandardChangeDocument(root: string, record: ActiveChangeRecord): string;
export declare function readStandardChangeDocument(path: string): ActiveChangeRecord | null;
