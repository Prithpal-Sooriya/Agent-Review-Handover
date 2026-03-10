export interface Learning {
  id?: string;
  sourcePr: string | number;
  pattern: string;
  capturedAt: string;
  scope?: "global" | "repo";
}
