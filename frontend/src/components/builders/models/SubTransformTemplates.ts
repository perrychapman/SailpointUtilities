export interface SubTransformTemplate {
    id: string;
    name?: string;
    type: string;
    attributes?: Record<string, any>;
  }
  
  export const BASE_SUB_TRANSFORM_TEMPLATES: SubTransformTemplate[] = [
    {
      id: "base_concat",
      name: "Concat",
      type: "concat",
      attributes: {
        values: [],
      },
    },
    {
      id: "base_lookup",
      name: "Lookup",
      type: "lookup",
      attributes: {
        table: {},
      },
    },
    {
      id: "base_accountAttribute",
      name: "Account Attribute",
      type: "accountAttribute",
      attributes: {
        sourceName: "",
        attributeName: "",
      },
    },
  ];
  