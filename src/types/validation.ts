export type SharedSchema = {
  type: "object";
  properties: Record<
    string,
    {
      type?: "string" | "integer";
      minLength?: number;
      maxLength?: number;
      minimum?: number;
    }
  >;
  required?: string[];
  additionalProperties?: boolean;
};
