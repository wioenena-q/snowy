import { ErrorTags, SnowyError } from './SnowyError';

/**
 * @classdesc A map that only allows unique values.
 * @extends {Map}
 */
export class UniqueMap<K extends string, V> extends Map<K, V> {
  /**
   * Set a value in the map.
   * @param key Unique key to set
   * @param value Value to set
   * @returns This map
   */
  public override set(key: K, value: V): this {
    if (this.has(key))
      throw new SnowyError(ErrorTags.NOT_UNIQUE, key);

    return super.set(key, value);
  }
}
