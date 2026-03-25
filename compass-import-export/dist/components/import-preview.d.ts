import React from 'react';
import type { CSVParsableFieldType, CSVField } from '../csv/csv-types';
type Field = {
    isArray?: boolean;
    path: string;
    type: CSVParsableFieldType;
    checked: boolean;
    result?: CSVField;
};
declare function ImportPreview({ fields, values, onFieldCheckedChanged, setFieldType, loaded, }: {
    fields: Field[];
    values: string[][];
    onFieldCheckedChanged: (fieldPath: string, checked: boolean) => void;
    setFieldType: (fieldPath: string, fieldType: string) => void;
    loaded: boolean;
}): React.JSX.Element | null;
export { ImportPreview };
//# sourceMappingURL=import-preview.d.ts.map