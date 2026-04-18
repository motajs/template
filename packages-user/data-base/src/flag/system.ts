import { IFlagCommonField, IFlagSystem, IFlagSystemSave } from './types';
import { FlagCommonField } from './field';

export class FlagSystem implements IFlagSystem {
    private readonly fieldMap: Map<PropertyKey, FlagCommonField<any>> =
        new Map();

    occupied(field: PropertyKey): boolean {
        return this.fieldMap.has(field);
    }

    insertField<T>(field: PropertyKey, value: T): IFlagCommonField<T> {
        return this.getOrInsert(field, value);
    }

    getField<T>(field: PropertyKey): IFlagCommonField<T> | null {
        return this.fieldMap.get(field) ?? null;
    }

    getOrInsert<T>(field: PropertyKey, defaultValue: T): IFlagCommonField<T> {
        return this.fieldMap.getOrInsertComputed(
            field,
            () => new FlagCommonField<T>(this, field, defaultValue)
        );
    }

    getOrInsertComputed<K extends PropertyKey, T>(
        field: K,
        defaultValue: (field: K) => T
    ): IFlagCommonField<T> {
        return this.fieldMap.getOrInsertComputed(
            field,
            () => new FlagCommonField<T>(this, field, defaultValue(field))
        );
    }

    deleteField(field: PropertyKey): void {
        this.fieldMap.delete(field);
    }

    setFieldValue(field: PropertyKey, value: any): void {
        this.getOrInsert(field, value).set(value);
    }

    addFieldValue(field: PropertyKey, value: number): void {
        this.getOrInsert(field, 0).add(value);
    }

    getFieldValue<T>(field: PropertyKey): T | undefined {
        return this.fieldMap.get(field)?.get();
    }

    getFieldValueDefaults<T>(field: PropertyKey, defaultValue: T): T {
        return this.getOrInsert(field, defaultValue).get();
    }

    saveState(): IFlagSystemSave {
        const fields: Map<PropertyKey, any> = new Map();
        for (const [key, field] of this.fieldMap) {
            fields.set(key, field.toStructured());
        }
        return { fields };
    }

    loadState(state: IFlagSystemSave): void {
        this.fieldMap.clear();
        for (const [key, data] of state.fields) {
            const field = new FlagCommonField<unknown>(this, key, undefined);
            field.fromStructured(data);
            this.fieldMap.set(key, field);
        }
    }
}
