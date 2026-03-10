import { Repo } from "./common.ts";

export interface PRContext {
  id: string | number;
  repo: Repo;
  base: string;
  head: string;
  description: string;
  state: "open" | "merged" | "closed";
  labels: string[];
  mergeable: boolean | null;
  headSha: string;
}
