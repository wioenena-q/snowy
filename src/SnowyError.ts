
export enum ErrorTags {
  NOT_UNIQUE = 'NOT_UNIQUE',
  TAG_NOT_FOUND = 'TAG_NOT_FOUND',
  METHOD_NOT_IMPLEMENTED = 'METHOD_NOT_IMPLEMENTED',
  VALUE_IS_NOT_OF_DESIRED_TYPE = 'VALUE_IS_NOT_OF_DESIRED_TYPE',
  VALUE_IS_NOT_INSTANCE_OF_DESIRED_CLASS = 'VALUE_IS_NOT_INSTANCE_OF_DESIRED_CLASS',
  MODULE_DOES_NOT_HAVE_A_PATH = 'MODULE_DOES_NOT_HAVE_A_PATH',
  MODULE_NOT_FOUND = 'MODULE_NOT_FOUND',
  EMITTER_NOT_FOUND = 'EMITTER_NOT_FOUND',
  INVALID_LISTENER_TYPE = 'INVALID_LISTENER_TYPE',
  InvalidArgument = 'InvalidArgument',
  InvalidReturnType = 'InvalidReturnType',
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
  [ErrorTags.NOT_UNIQUE]: (key: string) =>
    `The key '${key}' is not unique.`,
  [ErrorTags.TAG_NOT_FOUND]: (tag: string) =>
    `The tag '${tag}' was not found.`,
  [ErrorTags.METHOD_NOT_IMPLEMENTED]: (cls: string, method: string) =>
    `The method '${method}' of the class '${cls}' is not implemented.`,
  [ErrorTags.VALUE_IS_NOT_OF_DESIRED_TYPE]: (type: string, value: string, received: string) =>
    `The value '${value}' is not an ${type}. Received type: ${received} and required type: ${type}.`,
  [ErrorTags.VALUE_IS_NOT_INSTANCE_OF_DESIRED_CLASS]: (cls: string, value: string) =>
    `The value '${value}' is not an instance of ${cls}.`,
  [ErrorTags.MODULE_DOES_NOT_HAVE_A_PATH]: (modID: string) => `The module '${modID}' does not have a path.`,
  [ErrorTags.MODULE_NOT_FOUND]: (modID: string) => `The module '${modID}' was not found.`,
  [ErrorTags.EMITTER_NOT_FOUND]: (emitterID: string) => `The emitter '${emitterID}' was not found.`,
  [ErrorTags.INVALID_LISTENER_TYPE]: (type: string) => `The listener type '${type}' is invalid.`,
  [ErrorTags.InvalidArgument]: (argName: string, reason: string) => `Invalid argument: ${argName}. ${reason}`,
  [ErrorTags.InvalidReturnType]: (reason: string) => `Invalid return type. ${reason}`
};
