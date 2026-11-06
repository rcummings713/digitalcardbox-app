import data from "./imported-templates.json" with { type: "json" };
import type { DesignBlock } from "../design/contracts";
export interface ImportedTemplate {
  id: `licensed-${string}`;
  name: string;
  description: string;
  motif: "licensed-background";
  category:
    | "Wedding"
    | "Celebration"
    | "Baby"
    | "Birthday"
    | "Graduation"
    | "Remembrance"
    | "Thanks"
    | "Everyday";
  layout: "portrait";
  paper: string;
  ink: string;
  accent: string;
  palette: "blush" | "ivory" | "sage" | "midnight" | "lilac" | "ocean";
  artwork: string;
  credit: string;
  licenseUrl: string;
  sourceUrl: string;
  kinds?: ("card" | "invitation")[];
  textLayouts?: { card?: DesignBlock[]; invitation?: DesignBlock[] };
}
// Only the reviewed repository importer can add public catalog assets.
export const importedTemplates: readonly ImportedTemplate[] =
  data as ImportedTemplate[];
