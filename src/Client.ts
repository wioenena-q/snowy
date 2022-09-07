import type { ClientOptions, Snowflake, UserResolvable } from 'discord.js';
import { Client as BaseClient } from 'discord.js';

/**
 * @classdesc The Client class for the bot.
 * @extends {BaseClient}
 */
export class Client extends BaseClient {
  #owners: Snowflake[];

  public constructor ({ owners, token, clientOptions }: SnowyClientOptions) {
    super(clientOptions);
    this.token = token ?? null;
    this.#owners = owners ?? [];
  }

  /**
	 * Checks if the user is an owner of the bot.
	 * @param {UserResolvable} idOrInstance The ID or instance of the user to check.
	 * @returns {boolean} Whether or not the user is an bot owner.
	 */
  public isOwner (idOrInstance: UserResolvable): boolean {
    const id = this.users.resolveId(idOrInstance);

    return (id != null) ? this.#owners.includes(id) : false;
  }

  /**
	 * @returns {Snowflake[]} The owners of the bot.
	 */
  public get owners (): Snowflake[] {
    return this.#owners;
  }
}

export interface SnowyClientOptions {
  token?: string
  owners?: Snowflake[]
  clientOptions: ClientOptions
}
