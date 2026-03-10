export interface Comment {
  id: number;
  prId: string | number;
  author: string;
  body: string;
  classification?: "nit" | "discussion" | "unclear";
}
