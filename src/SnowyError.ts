export enum ErrorTags {
  NOT_UNIQUE = 'NOT_UNIQUE',
  TAG_NOT_FOUND = 'TAG_NOT_FOUND'
}

/**
 * @classdesc Error class for Snowy
 * @extends {Error}
 */
export class SnowyError extends Error {
  #tag: string;
  /**
   *
   * @param tag Error tag
   * @param extras Extra information
   */
  public constructor(tag: ErrorTags, ...extras: string[]) {
    if (!(tag in ErrorTags)) throw new SnowyError(ErrorTags.TAG_NOT_FOUND, tag);
    super(tagToMessage[tag](...extras));
    this.#tag = tag;
  }

  public override get name(): string {
    return `${this.constructor.name} [${this.#tag}]`;
  }
}

const tagToMessage: Record<ErrorTags, (...params: string[]) => string> = {
  [ErrorTags.NOT_UNIQUE]: (key: string, extra?: string) =>
    `The key '${key}' is not unique.${extra !== undefined ? ` ${extra}` : ''}`,
  [ErrorTags.TAG_NOT_FOUND]: (tag: string, extra?: string) =>
    `The tag '${tag}' was not found.${extra !== undefined ? ` ${extra}` : ''}`
};
