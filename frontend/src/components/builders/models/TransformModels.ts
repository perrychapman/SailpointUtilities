export interface SubTransform {
    id: string;
    name?: string;
    type: string;
    attributes?: Record<string, any>;
    nestingLevel?: number;
    projectId?: string;
    index?: number;
    parentId?: string | null;
    isTopLevel?: boolean;
    displayPath?: string;
}

export interface TransformProject {
    id: string;
    name: string;
    type: string;
    description?: string;
    subTransforms: SubTransform[];
}

export interface SubTransformTemplate {
    id: string;
    name?: string;
    type: string;
    attributes?: Record<string, any>;
}