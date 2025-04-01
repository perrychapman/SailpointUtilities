export interface TransformAttributes {
    [key: string]: any;
}
export interface TransformConfig {
    id?: string;
    name?: string;
    type: string;
    attributes?: TransformAttributes;
}
export interface TransformRecord {
    id?: string;
    name?: string;
    type: string;
    level: number;
    parsed_notation: string;
    attributes?: Record<string, any>;
    inputs?: TransformRecord[];
}
export declare function parseTransform(input: any, level?: number): TransformRecord;
