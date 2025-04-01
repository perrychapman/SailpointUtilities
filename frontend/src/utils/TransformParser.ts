// ===========================
// TransformParser.ts
// ===========================

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

// ===========================
// Main Parsing Functions
// ===========================

export function parseTransform(input: any, level: number = 0): TransformRecord {
    if (!input || typeof input !== "object") {
        return { type: "literal", level, parsed_notation: JSON.stringify(input) };
    }

    const id = input.id || "unknown";
    const name = input.name || undefined;
    const type = input.type || "unknown";
    const attributes = input.attributes || {};

    // Get transform-specific parser
    const parserFunction = transformParsers[type] || parseUnknownTransform;
    const parsedTransform = parserFunction(input, level);

    const parsedAttributes: Record<string, any> = {};
    const inputs: TransformRecord[] = [];

    for (const [key, val] of Object.entries(attributes)) {
        if (val && typeof val === "object") {
            const nestedParsed = parseNestedOperation(val, level + 1);
            parsedAttributes[key] = nestedParsed.parsed_notation.trim();
            inputs.push(nestedParsed);
        } else {
            parsedAttributes[key] = val;
        }
    }

    return {
        id,
        name,
        type,
        level,
        parsed_notation: parsedTransform.parsed_notation,
        attributes: parsedAttributes,
        inputs,
    };
}

// ===========================
// Nested Transform Handler
// ===========================

function parseNestedOperation(value: any, level: number): TransformRecord {
    if (!value || typeof value !== "object") {
        return { type: "literal", level, parsed_notation: JSON.stringify(value) };
    }

    if (Array.isArray(value)) {
        const parsedInputs = value.map((v) => parseNestedOperation(v, level + 1));
        return {
            type: "array",
            level,
            parsed_notation: parsedInputs.map((p) => `→ ${p.parsed_notation.trim()}`).join("\n"),
            inputs: parsedInputs,
        };
    }

    if ("type" in value) {
        const parsedTransform = parseTransform(value, level);
        return {
            ...parsedTransform,
            parsed_notation: parsedTransform.parsed_notation.trim(),
        };
    }

    const parsedInputs: TransformRecord[] = [];
    let parsedNotationParts: string[] = [];

    for (const [key, val] of Object.entries(value)) {
        const nestedParsed = parseNestedOperation(val, level + 1);
        parsedInputs.push(nestedParsed);
        parsedNotationParts.push(`${key}: ${nestedParsed.parsed_notation.trim()}`);
    }

    return {
        type: "object",
        level,
        parsed_notation: parsedNotationParts.join("\n"),
        attributes: value,
        inputs: parsedInputs,
    };
}

// ===========================
// Transform Type Parsers
// ===========================

const transformParsers: Record<string, (t: TransformConfig, i: number) => TransformRecord> = {
    "accountAttribute": parseAccountAttributeTransform,
    "lookup": parseLookupTransform,
    "firstValid": parseFirstValidTransform,
    "static": parseStaticTransform,
    "concat": parseConcatTransform,
    "conditional": parseConditionalTransform,
    "dateCompare": parseDateCompareTransform,
    "dateFormat": parseDateFormatTransform,
    "dateMath": parseDateMathTransform,
    "decomposeDiacriticalMarks": parseDecomposeDiacriticalMarksTransform,
    "e164phone": parseE164PhoneTransform,
    "generateRandomString": parseGenerateRandomStringTransform,
    "getEndOfString": parseGetEndOfStringTransform,
    "identityAttribute": parseIdentityAttributeTransform,
    "indexOf": parseIndexOfTransform,
    "iso3166": parseISO3166Transform,
    "lastIndexOf": parseLastIndexOfTransform,
    "leftPad": parseLeftPadTransform,
    "lower": parseLowerTransform,
    "normalizeNames": parseNameNormalizerTransform,
    "randomAlphanumeric": parseRandomAlphanumericTransform,
    "randomNumeric": parseRandomNumericTransform,
    "reference": parseReferenceTransform,
    "replaceAll": parseReplaceAllTransform,
    "replace": parseReplaceTransform,
    "rfc5646": parseRfc5646Transform,
    "rightPad": parseRightPadTransform,
    "rule": parseRuleTransform,
    "split": parseSplitTransform,
    "substring": parseSubstringTransform,
    "trim": parseTrimTransform,
    "upper": parseUpperTransform,
    "usernameGenerator": parseUsernameGeneratorTransform,
    "uuidGenerator": parseUuidTransform,
};

// ===========================
// Transform-Specific Parsers
// ===========================

function parseIdentityAttributeTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Base notation
    let parsed_notation = `${indent}IDENTITY ATTRIBUTE (${attributes.name || "Unknown"})`;

    // Optional attributes
    const extraAttributes: string[] = [];
    if ("requiresPeriodicRefresh" in attributes) {
        extraAttributes.push(`Reevaluate Periodically: ${attributes.requiresPeriodicRefresh}`);
    }
    if (attributes.input) {
        extraAttributes.push(`Input: ${parseNestedOperation(attributes.input, level + 1)}`);
    }

    if (extraAttributes.length > 0) {
        parsed_notation += `\n${indent}  ${extraAttributes.join(`\n${indent}  `)}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseAccountAttributeTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);
    
    // Base notation
    let parsed_notation = `${indent}ACCOUNT ATTRIBUTE (Source: ${attributes.sourceName || "Unknown"}, Attribute: ${attributes.attributeName || "Unknown"})`;

    // Optional attributes (Indented for readability)
    const extraAttributes: string[] = [];
    if (attributes.accountSortAttribute) {
        extraAttributes.push(`Sort By: ${attributes.accountSortAttribute}`);
    }
    if ("accountSortDescending" in attributes) {
        extraAttributes.push(`Descending Sort: ${attributes.accountSortDescending}`);
    }
    if ("accountReturnFirstLink" in attributes) {
        extraAttributes.push(`Return First Link: ${attributes.accountReturnFirstLink}`);
    }
    if (attributes.accountFilter) {
        extraAttributes.push(`Filter: ${attributes.accountFilter}`);
    }
    if (attributes.accountPropertyFilter) {
        extraAttributes.push(`Property Filter: ${attributes.accountPropertyFilter}`);
    }
    if ("requiresPeriodicRefresh" in attributes) {
        extraAttributes.push(`Reevaluate Periodically: ${attributes.requiresPeriodicRefresh}`);
    }

    if (extraAttributes.length > 0) {
        parsed_notation += `\n${indent}  ${extraAttributes.join(`\n${indent}  `)}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseLookupTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}LOOKUP TABLE\n`;

    // Handle input (if present)
    let inputParsed = "(Direct input expected)";
    let inputs: TransformRecord[] = [];
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);
        inputParsed = parsedInput.parsed_notation;
        inputs.push(parsedInput);
    }
    parsed_notation += `${indent}  Input Value: ${inputParsed}\n`;

    // Extract table entries, handling both plain values and nested transforms
    const table = attributes.table || {};
    let tableEntries = [];

    for (const [key, value] of Object.entries(table)) {
        if (value === null || value === undefined) {
            tableEntries.push(`${indent}  ${key} → null`);
        } else if (typeof value === "string") {
            // Normal key-value pair
            tableEntries.push(`${indent}  ${key} → ${value}`);
        } else if (typeof value === "object" && "type" in value) {
            // Handle nested transforms inside lookup values
            const parsedValue = parseNestedOperation(value, level + 1);
            inputs.push(parsedValue);
            tableEntries.push(`${indent}  ${key} → ${parsedValue.parsed_notation}`);
        } else {
            tableEntries.push(`${indent}  ${key} → (Unsupported type)`);
        }
    }    

    // Add table entries to output
    if (tableEntries.length > 0) {
        parsed_notation += `${tableEntries.join("\n")}\n`;
    }

    // Handle default case (which could be another lookup transform!)
    if ("default" in table) {
        if (typeof table.default === "string") {
            parsed_notation += `${indent}  (Default: ${table.default})\n`;
        } else if (typeof table.default === "object" && "type" in table.default) {
            const parsedDefault = parseNestedOperation(table.default, level + 1);
            inputs.push(parsedDefault);
            parsed_notation += `${indent}  (Default: ${parsedDefault.parsed_notation})\n`;
        }
    } else {
        parsed_notation += `${indent}  (No default value set – unmatched keys will cause an error)\n`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs,
    };
}

function parseFirstValidTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}FIRST VALID VALUE:`;

    // Extract readable parsed_notation for values
    const values: TransformConfig[] = attributes.values || [];
    if (values.length > 0) {
        values.forEach((v) => {
            const parsedValue = parseNestedOperation(v, level + 1);
            parsed_notation += `\n${indent}  → ${parsedValue.parsed_notation}`;
        });
    } else {
        parsed_notation += `\n${indent}  (No values provided)`;
    }

    // Handle ignoreErrors flag
    if (attributes.ignoreErrors !== undefined) {
        parsed_notation += `\n${indent}  (Ignore errors: ${attributes.ignoreErrors})`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: values.map((v) => parseTransform(v, level + 1)), // Process nested transforms
    };
}

function parseStaticTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}STATIC("${attributes.value || "Unknown"}")`;

    // 🔥 Fix: Extract `parsed_notation` for nested attributes
    const dynamicVariables = Object.entries(attributes)
        .filter(([key]) => key !== "value") // Ignore "value" since it's already handled
        .map(([key, v]) => {
            const parsedValue = parseNestedOperation(v, level + 1);
            return `${indent}  ${key}: ${parsedValue.parsed_notation}`;
        });

    if (dynamicVariables.length > 0) {
        parsed_notation += `\n${indent}  Dynamic Variables:\n${dynamicVariables.join("\n")}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: Object.values(attributes).map((v) => parseNestedOperation(v, level + 1)),
    };
}

function parseDecomposeDiacriticalMarksTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Parse input (if provided)
    let inputParsed = "(Direct input expected)";
    let inputs: TransformRecord[] = [];
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);
        inputParsed = parsedInput.parsed_notation;
        inputs.push(parsedInput);
    }

    // Build structured notation
    let parsed_notation = `${indent}DECOMPOSE DIACRITICAL MARKS\n`;
    parsed_notation += `${indent}  → Input: ${inputParsed}`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs,
    };
}

function parseConcatTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}CONCATENATION`;

    // Extract values
    const values: TransformConfig[] = attributes.values || [];
    if (values.length > 0) {
        values.forEach((v) => {
            const parsedValue = parseNestedOperation(v, level + 1);
            parsed_notation += `\n${indent}  → ${parsedValue.parsed_notation}`;
        });
    } else {
        parsed_notation += `\n${indent}  (No values provided)`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: values.map((v) => parseTransform(v, level + 1)), // Ensure nested transforms are processed
    };
}

function parseReferenceTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Base notation for reference transform
    let parsed_notation = `${indent}REFERENCE → "${attributes.id || "Unknown Reference"}"`;

    // Optional attributes (e.g., input)
    const extraAttributes: string[] = [];
    if ("requiresPeriodicRefresh" in attributes) {
        extraAttributes.push(`Reevaluate Periodically: ${attributes.requiresPeriodicRefresh}`);
    }
    if (attributes.input) {
        extraAttributes.push(`Input: ${parseNestedOperation(attributes.input, level + 1).parsed_notation}`);
    }

    // Append any extra attributes
    if (extraAttributes.length > 0) {
        parsed_notation += `\n${indent}  ${extraAttributes.join(`\n${indent}  `)}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: attributes.input ? [parseNestedOperation(attributes.input, level + 1)] : [],
    };
}

function parseDateCompareTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Map operators to human-readable symbols
    const operatorMap: Record<string, string> = {
        "lt": "<",
        "lte": "<=",
        "gt": ">",
        "gte": ">=",
    };
    
    // Extract required attributes with proper parsing
    const firstDateParsed = parseNestedOperation(attributes.firstDate, level + 1).parsed_notation;
    const secondDateParsed = parseNestedOperation(attributes.secondDate, level + 1).parsed_notation;
    const operator = operatorMap[attributes.operator] || attributes.operator;

    const positiveConditionParsed = parseNestedOperation(attributes.positiveCondition, level + 1).parsed_notation;
    const negativeConditionParsed = parseNestedOperation(attributes.negativeCondition, level + 1).parsed_notation;

    // Build structured output
    let parsed_notation = `${indent}DATE COMPARE\n`;
    parsed_notation += `${indent}  → First Date: ${firstDateParsed}\n`;
    parsed_notation += `${indent}  → Second Date: ${secondDateParsed}\n`;
    parsed_notation += `${indent}  → Condition: firstDate ${operator} secondDate\n`;
    parsed_notation += `${indent}  → If TRUE: ${positiveConditionParsed}\n`;
    parsed_notation += `${indent}  → If FALSE: ${negativeConditionParsed}`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [
            parseNestedOperation(attributes.firstDate, level + 1),
            parseNestedOperation(attributes.secondDate, level + 1),
            parseNestedOperation(attributes.positiveCondition, level + 1),
            parseNestedOperation(attributes.negativeCondition, level + 1),
        ],
    };
}

function parseDateMathTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract expression & roundUp flag
    const rawExpression = attributes.expression || "Unknown";
    const roundUp = attributes.roundUp !== undefined ? `Rounding Up: ${attributes.roundUp}` : "";

    // Convert the raw expression to a more human-readable format
    const humanReadableExpression = convertDateMathExpression(rawExpression);

    // Parse input (if provided)
    let inputParsed = "(Direct input expected)";
    let inputs: TransformRecord[] = [];
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);
        inputParsed = parsedInput.parsed_notation;
        inputs.push(parsedInput);
    }

    // Build structured notation
    let parsed_notation = `${indent}DATE MATH\n`;
    parsed_notation += `${indent}  → Operation: ${humanReadableExpression}\n`;
    parsed_notation += `${indent}  → Input: ${inputParsed}\n`;
    if (roundUp) parsed_notation += `${indent}  → ${roundUp}`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs,
    };
}

function convertDateMathExpression(expression: string): string {
    if (expression === "now") return "Current Date & Time";

    // Define a mapping of time units to human-readable terms
    const timeUnits: Record<string, string> = {
        "y": "years",
        "M": "months",
        "w": "weeks",
        "d": "days",
        "h": "hours",
        "m": "minutes",
        "s": "seconds"
    };

    let readableExpression = expression
        .replace(/now/g, "Current Date/Time")  // Replace "now"
        .replace(/([+-])(\d+)([yMwdhms])/g, (_, sign, value, unit) => {
            const humanUnit = timeUnits[unit] || unit;
            return `${sign === "+" ? " +" : " -"} ${value} ${humanUnit}`;
        })
        .replace(/\/([yMwdhms])/g, (_, unit) => `, rounded to ${timeUnits[unit] || unit}`);

    return readableExpression;
}

function parseDateFormatTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract input/output formats and humanize them
    const inputFormat = attributes.inputFormat || "ISO8601 (Default)";
    const outputFormat = attributes.outputFormat || "ISO8601 (Default)";

    // Parse input (if provided)
    let inputParsed = "(Direct input expected)";
    let inputs: TransformRecord[] = [];
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);
        inputParsed = parsedInput.parsed_notation;
        inputs.push(parsedInput);
    }

    // Build structured notation
    let parsed_notation = `${indent}DATE FORMAT\n`;
    parsed_notation += `${indent}  → Input Format: ${formatToReadable(inputFormat)}\n`;
    parsed_notation += `${indent}  → Output Format: ${formatToReadable(outputFormat)}\n`;
    parsed_notation += `${indent}  → Input: ${inputParsed}`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs,
    };
}

function formatToReadable(format: string): string {
    const formatMapping: Record<string, string> = {
        "ISO8601": "ISO8601 (yyyy-MM-dd'T'HH:mm:ss.SSSZ)",
        "LDAP": "LDAP Format (yyyyMMddHHmmss.Z)",
        "PEOPLE_SOFT": "PeopleSoft (MM/dd/yyyy)",
        "EPOCH_TIME_JAVA": "Epoch Time (Milliseconds since 1970-01-01)",
        "EPOCH_TIME_WIN32": "Windows Epoch Time (100-nanosecond intervals since 1601-01-01)",
    };

    return formatMapping[format] || format;
}

function parseRuleTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}RULE → "${attributes.name || "Unknown Rule"}"`;

    // Handle variables
    const variableEntries = Object.entries(attributes)
        .filter(([key]) => key !== "name") // Ignore the rule name
        .map(([key, value]) => {
            const parsedValue = parseNestedOperation(value, level + 1).parsed_notation;
            return `${indent}  ${key}: ${parsedValue}`;
        });

    if (variableEntries.length > 0) {
        parsed_notation += `\n${variableEntries.join("\n")}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: Object.values(attributes).map((v) => parseNestedOperation(v, level + 1)),
    };
}

function parseConditionalTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract key attributes
    let expression = attributes.expression || "Unknown Expression";
    const positiveCondition = attributes.positiveCondition
        ? parseNestedOperation(attributes.positiveCondition, level + 1).parsed_notation
        : "Undefined";
    const negativeCondition = attributes.negativeCondition
        ? parseNestedOperation(attributes.negativeCondition, level + 1).parsed_notation
        : "Undefined";

    // 🔥 Translate operators to human-readable format
    const operatorMap: Record<string, string> = {
        "eq": "equals",
        "ne": "does not equal",
        "gt": "is greater than",
        "gte": "is greater than or equal to",
        "lt": "is less than",
        "lte": "is less than or equal to"
    };

    // Replace all operators in the expression
    expression = expression.replace(/\b(eq|ne|gt|gte|lt|lte)\b/g, (match: string) => operatorMap[match] || match);

    let parsed_notation = `${indent}CONDITIONAL (${expression})`;
    parsed_notation += `\n${indent}  → If TRUE: ${positiveCondition}`;
    parsed_notation += `\n${indent}  → If FALSE: ${negativeCondition}`;

    // Handle additional attributes (e.g., variables used in expression)
    const variableEntries = Object.entries(attributes)
        .filter(([key]) => !["expression", "positiveCondition", "negativeCondition"].includes(key))
        .map(([key, value]) => {
            const parsedValue = parseNestedOperation(value, level + 1).parsed_notation;
            return `${indent}  ${key}: ${parsedValue}`;
        });

    if (variableEntries.length > 0) {
        parsed_notation += `\n${variableEntries.join("\n")}`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: Object.values(attributes).map((v) => parseNestedOperation(v, level + 1)),
    };
}

function parseNameNormalizerTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}NAME NORMALIZATION`;

    // Handle input (ensuring notation consistency)
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1).parsed_notation;
        parsed_notation += `\n${indent}  → Input: ${parsedInput}`;
    } else {
        parsed_notation += `\n${indent}  → Input: (Direct input expected)`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: attributes.input ? [parseTransform(attributes.input, level + 1)] : [],
    };
}

function parseTrimTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}TRIM`;

    // Handle input (ensuring notation consistency)
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1).parsed_notation;
        parsed_notation += `\n${indent}  → Input: ${parsedInput}`;
    } else {
        parsed_notation += `\n${indent}  → Input: (Direct input expected)`;
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: attributes.input ? [parseTransform(attributes.input, level + 1)] : [],
    };
}

function parseLowerTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}LOWERCASE`;

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // If the input is a simple static value, format compactly
        if (parsedInput.type === "static" && parsedInput.attributes?.value) {
            parsed_notation = `${indent}LOWERCASE("${parsedInput.attributes.value}")`;
        } else {
            parsed_notation += `\n${indent}  → Input: ${parsedInput.parsed_notation}`;
        }

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, default notation
    parsed_notation = `${indent}LOWERCASE("(Direct input expected)")`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseUpperTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}UPPERCASE`;

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // If the input is a simple static value, format compactly
        if (parsedInput.type === "static" && parsedInput.attributes?.value) {
            parsed_notation = `${indent}UPPERCASE("${parsedInput.attributes.value}")`;
        } else {
            parsed_notation += `\n${indent}  → Input: ${parsedInput.parsed_notation}`;
        }

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, default notation
    parsed_notation = `${indent}UPPERCASE("(Direct input expected)")`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseSplitTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    let parsed_notation = `${indent}SPLIT`;

    // Extract required attributes
    const delimiter = attributes.delimiter ? `"${attributes.delimiter}"` : `"Unknown Delimiter"`;
    const index = attributes.index !== undefined ? attributes.index : `"Unknown Index"`;

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // If input is a simple static value, use compact format
        if (parsedInput.type === "static" && parsedInput.attributes?.value) {
            parsed_notation = `${indent}SPLIT("${parsedInput.attributes.value}", ${delimiter}, ${index})`;
        } else {
            parsed_notation += `\n${indent}  → Input: ${parsedInput.parsed_notation}`;
            parsed_notation += `\n${indent}  → Delimiter: ${delimiter}`;
            parsed_notation += `\n${indent}  → Index: ${index}`;
        }

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, default notation
    parsed_notation = `${indent}SPLIT("(Direct input expected)", ${delimiter}, ${index})`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseSubstringTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract required and optional attributes
    const begin = attributes.begin !== undefined ? attributes.begin : `"Unknown Start Index"`;
    const end = attributes.end !== undefined ? attributes.end : "end of string";
    const beginOffset = attributes.beginOffset !== undefined ? ` + ${attributes.beginOffset}` : "";
    const endOffset = attributes.endOffset !== undefined ? ` + ${attributes.endOffset}` : "";

    let parsed_notation: string;

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // Check if input is a simple static value for compact notation
        if (parsedInput.type === "static") {
            parsed_notation = `SUBSTRING(Begin Index: ${begin}${beginOffset}, End Index: ${end}${endOffset}, ${parsedInput.parsed_notation})`;
        } else {
            // Expanded notation for non-static inputs
            parsed_notation = `${indent}SUBSTRING`;
            parsed_notation += `\n${indent}  → Begin Index: ${begin}${beginOffset}`;
            parsed_notation += `\n${indent}  → End Index: ${end}${endOffset}`;
            parsed_notation += `\n${indent}  → Input: ${parsedInput.parsed_notation}`;
        }

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, show placeholder
    parsed_notation = `SUBSTRING(Begin Index: ${begin}${beginOffset}, End Index: ${end}${endOffset}, "(Direct input expected)")`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseReplaceTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract required attributes
    const regex = attributes.regex ? `"${attributes.regex}"` : `"Unknown Pattern"`;
    const replacement = attributes.replacement !== undefined ? `"${attributes.replacement}"` : `"Unknown Replacement"`;

    let parsed_notation: string;

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // Detect empty replacement string
        const replacementText = attributes.replacement === "" ? `"" (Empty String)` : replacement;

        // If input is a simple static value, use compact notation
        if (parsedInput.type === "static") {
            parsed_notation = `REPLACE(${parsedInput.parsed_notation}, Pattern: ${regex}, Replacement: ${replacementText})`;
        } else {
            // Expanded notation for non-static inputs
            parsed_notation = `${indent}REPLACE`;
            parsed_notation += `\n${indent}  → Input: ${parsedInput.parsed_notation}`;
            parsed_notation += `\n${indent}  → Pattern: ${regex}`;
            parsed_notation += `\n${indent}  → Replacement: ${replacementText}`;
        }

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, show placeholder
    parsed_notation = `REPLACE("(Direct input expected)", Pattern: ${regex}, Replacement: ${replacement === '""' ? '"" (Empty String)' : replacement})`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseReplaceAllTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    // Extract replacement table
    const table = attributes.table || {};
    let tableEntries: string[] = [];

    for (const [pattern, replacement] of Object.entries(table)) {
        const replacementText = replacement === "" ? `"" (Empty String)` : `"${replacement}"`;
        tableEntries.push(`${indent}  ${pattern} → ${replacementText}`);
    }

    // Check if input exists
    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // Compact notation when input is simple
        if (parsedInput.type === "static") {
            return {
                id: transform.id || "unknown",
                name: transform.name || undefined,
                type: transform.type,
                level,
                parsed_notation: `REPLACE_ALL(${parsedInput.parsed_notation}, { ${tableEntries.join(", ")} })`,
                attributes,
                inputs: [parsedInput],
            };
        }

        // Expanded notation for nested inputs
        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation: `${indent}REPLACE ALL\n${indent}  → Input: ${parsedInput.parsed_notation}\n${indent}  → Table:\n${tableEntries.join("\n")}`,
            attributes,
            inputs: [parsedInput],
        };
    }

    // If no input, show placeholder
    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: `REPLACE_ALL("(Direct input expected)", { ${tableEntries.join(", ")} })`,
        attributes,
        inputs: [],
    };
}

function parseE164PhoneTransform(transform: TransformConfig, level: number): TransformRecord {
    const attributes = transform.attributes || {};
    const indent = "  ".repeat(level);

    const defaultRegion = attributes.defaultRegion ? ` (Default Region: ${attributes.defaultRegion})` : "";

    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);

        // Compact notation for simple static input
        if (parsedInput.type === "static") {
            return {
                id: transform.id || "unknown",
                name: transform.name,
                type: transform.type,
                level,
                parsed_notation: `E164_PHONE(${parsedInput.parsed_notation}${defaultRegion})`,
                attributes,
                inputs: [parsedInput],
            };
        }

        // Expanded notation for anything more complex
        return {
            id: transform.id || "unknown",
            name: transform.name,
            type: transform.type,
            level,
            parsed_notation: `${indent}E.164 PHONE${defaultRegion}\n${indent}  → Input: ${parsedInput.parsed_notation}`,
            attributes,
            inputs: [parsedInput],
        };
    }

    // Fallback if input isn't provided
    return {
        id: transform.id || "unknown",
        name: transform.name,
        type: transform.type,
        level,
        parsed_notation: `E164_PHONE("(Direct input expected)"${defaultRegion})`,
        attributes,
        inputs: [],
    };
}

function parseGenerateRandomStringTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};

    const includeNumbers = attributes.includeNumbers === "true";
    const includeSpecial = attributes.includeSpecialChars === "true";
    const length = attributes.length || "undefined";

    const descriptionParts = [
        `${indent}GENERATE RANDOM STRING`,
        `${indent}  → Length: ${length}`,
        `${indent}  → Include Numbers: ${includeNumbers}`,
        `${indent}  → Include Special Characters: ${includeSpecial}`
    ];

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: descriptionParts.join("\n"),
        attributes,
        inputs: []
    };
}

function parseGetEndOfStringTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const numChars = attributes.numChars ?? "undefined";

    const notationLines = [
        `${indent}GET END OF STRING`,
        `${indent}  → Last ${numChars} characters`
    ];

    let inputs: TransformRecord[] = [];

    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        notationLines.push(`${indent}  → Input: ${inputParsed.parsed_notation}`);
        inputs.push(inputParsed);
    } else if (typeof attributes.input === "string") {
        notationLines.push(`${indent}  → Input: "${attributes.input}"`);
    } else {
        notationLines.push(`${indent}  → Input: (From source/attribute config)`);
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: notationLines.join("\n"),
        attributes,
        inputs
    };
}

function parseIndexOfTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const substring = attributes.substring ?? "(no substring provided)";
    
    const notationLines = [
        `${indent}INDEX OF`,
        `${indent}  → Substring to Find: "${substring}"`
    ];

    const inputs: TransformRecord[] = [];

    // Handle input if provided
    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        notationLines.push(`${indent}  → Input: ${inputParsed.parsed_notation}`);
        inputs.push(inputParsed);
    } else if (typeof attributes.input === "string") {
        notationLines.push(`${indent}  → Input: "${attributes.input}"`);
    } else {
        notationLines.push(`${indent}  → Input: (From source/attribute config)`);
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: notationLines.join("\n"),
        attributes,
        inputs
    };
}

function parseISO3166Transform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const format = attributes.format || "alpha2";

    const lines = [`${indent}ISO3166 COUNTRY CONVERSION`];
    lines.push(`${indent}  → Output Format: ${format.toUpperCase()}`);

    const inputs: TransformRecord[] = [];

    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        lines.push(`${indent}  → Input: ${inputParsed.parsed_notation}`);
        inputs.push(inputParsed);
    } else if (typeof attributes.input === "string") {
        lines.push(`${indent}  → Input: "${attributes.input}"`);
    } else {
        lines.push(`${indent}  → Input: (From source/attribute config)`);
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: lines.join("\n"),
        attributes,
        inputs
    };
}

function parseLastIndexOfTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const substring = attributes.substring || "(no substring provided)";

    const lines = [`${indent}LAST INDEX OF`];
    lines.push(`${indent}  → Substring to Find: "${substring}"`);

    const inputs: TransformRecord[] = [];

    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        lines.push(`${indent}  → Input: ${inputParsed.parsed_notation}`);
        inputs.push(inputParsed);
    } else if (typeof attributes.input === "string") {
        lines.push(`${indent}  → Input: "${attributes.input}"`);
    } else {
        lines.push(`${indent}  → Input: (From source/attribute config)`);
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: lines.join("\n"),
        attributes,
        inputs
    };
}

function parseLeftPadTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const length = attributes.length ?? "(no length)";
    const padding = attributes.padding ?? " ";
    let inputDisplay = "(From source/attribute config)";
    const inputs: TransformRecord[] = [];

    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        inputDisplay = inputParsed.parsed_notation;
        inputs.push(inputParsed);

        // Check if this is a static value (so we can show compact)
        if (
            attributes.input.type === "static" &&
            attributes.input.attributes &&
            typeof attributes.input.attributes.value === "string"
        ) {
            const value = attributes.input.attributes.value;
            return {
                id: transform.id || "unknown",
                name: transform.name || undefined,
                type: transform.type,
                level,
                parsed_notation: `${indent}LEFTPAD("${value}", Length: ${length}, Pad: "${padding}")`,
                attributes,
                inputs
            };
        }

    } else if (typeof attributes.input === "string") {
        inputDisplay = `"${attributes.input}"`;

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation: `${indent}LEFTPAD(${inputDisplay}, Length: ${length}, Pad: "${padding}")`,
            attributes,
            inputs
        };
    }

    // Full verbose format fallback
    const lines = [`${indent}LEFT PAD`];
    lines.push(`${indent}  → Target Length: ${length}`);
    lines.push(`${indent}  → Padding Character: "${padding}"`);
    lines.push(`${indent}  → Input: ${inputDisplay}`);

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: lines.join("\n"),
        attributes,
        inputs
    };
}

function parseRightPadTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const length = attributes.length ?? "(no length)";
    const padding = attributes.padding ?? " ";
    let inputDisplay = "(From source/attribute config)";
    const inputs: TransformRecord[] = [];

    if (attributes.input && typeof attributes.input === "object") {
        const inputParsed = parseNestedOperation(attributes.input, level + 1);
        inputDisplay = inputParsed.parsed_notation;
        inputs.push(inputParsed);

        // Compact format if static string input
        if (
            attributes.input.type === "static" &&
            attributes.input.attributes &&
            typeof attributes.input.attributes.value === "string"
        ) {
            const value = attributes.input.attributes.value;
            return {
                id: transform.id || "unknown",
                name: transform.name || undefined,
                type: transform.type,
                level,
                parsed_notation: `${indent}RIGHTPAD("${value}", Length: ${length}, Pad: "${padding}")`,
                attributes,
                inputs
            };
        }

    } else if (typeof attributes.input === "string") {
        inputDisplay = `"${attributes.input}"`;

        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation: `${indent}RIGHTPAD(${inputDisplay}, Length: ${length}, Pad: "${padding}")`,
            attributes,
            inputs
        };
    }

    // Full verbose format fallback
    const lines = [`${indent}RIGHT PAD`];
    lines.push(`${indent}  → Target Length: ${length}`);
    lines.push(`${indent}  → Padding Character: "${padding}"`);
    lines.push(`${indent}  → Input: ${inputDisplay}`);

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: lines.join("\n"),
        attributes,
        inputs
    };
}

function parseRandomAlphanumericTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const length = attributes.length ?? 32;

    const parsed_notation = `${indent}RANDOM ALPHANUMERIC STRING (Length: ${length})`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: []
    };
}

function parseRandomNumericTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const length = attributes.length ?? 10;

    const parsed_notation = `${indent}RANDOM NUMERIC STRING (Length: ${length})`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: []
    };
}

function parseRfc5646Transform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};

    let parsed_notation = `${indent}RFC 5646 LANGUAGE CONVERSION`;

    if (attributes.input) {
        const parsedInput = parseNestedOperation(attributes.input, level + 1);
        parsed_notation += `\n${indent}→ Input: ${parsedInput.parsed_notation}`;
        return {
            id: transform.id || "unknown",
            name: transform.name || undefined,
            type: transform.type,
            level,
            parsed_notation,
            attributes,
            inputs: [parsedInput],
        };
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs: [],
    };
}

function parseUsernameGeneratorTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const attributes = transform.attributes || {};
    const patterns = attributes.patterns || [];

    let parsed_notation = `${indent}USERNAME GENERATOR`;
    if (patterns.length > 0) {
        parsed_notation += `\n${indent}→ Patterns:\n` +
            patterns.map((p: string) => `${indent}  - ${p}`).join("\n");
    }

    if (attributes.sourceCheck) {
        parsed_notation += `\n${indent}→ Check Target Source: ${attributes.sourceCheck}`;
    }

    const inputs: TransformRecord[] = [];

    // Parse variable definitions (e.g., fn, ln, fi, mi, etc.)
    for (const [key, val] of Object.entries(attributes)) {
        if (["patterns", "sourceCheck"].includes(key)) continue;

        const nestedParsed = parseNestedOperation(val, level + 1);
        parsed_notation += `\n${indent}→ ${key}: ${nestedParsed.parsed_notation}`;
        inputs.push(nestedParsed);
    }

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes,
        inputs,
    };
}

function parseUuidTransform(transform: TransformConfig, level: number): TransformRecord {
    const indent = "  ".repeat(level);
    const parsed_notation = `${indent}UUID()`;

    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation,
        attributes: transform.attributes || {},
        inputs: [],
    };
}

// ===========================
// Generic Placeholder Parser
// ===========================

function genericTransform(name: string, transform: TransformConfig, level: number): TransformRecord {
    return {
        id: transform.id || "unknown",
        name: transform.name || undefined,
        type: transform.type,
        level,
        parsed_notation: `${"  ".repeat(level)}${name} (...)`,
        attributes: transform.attributes || {},
        inputs: [],
    };
}

// ===========================
// Unknown Transform Parser
// ===========================

function parseUnknownTransform(transform: TransformConfig, level: number): TransformRecord {
    return genericTransform(`Unknown Transform Type: ${transform.type}`, transform, level);
}
