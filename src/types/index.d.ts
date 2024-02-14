type Snowflake = `${number}`;
type Nullable<T> = T | null;
type AvatarDecorationData = {
  asset: string;
  sku_id: Snowflake;
};

export type User = {
  id: Snowflake;
  username: string;
  avatar: Nullable<string>;
  discriminator: `${number}`;
  public_flags: number;
  premium_type: number;
  flags: number;
  banner: Nullable<string>;
  accent_color: Nullable<number>;
  global_name: Nullable<string>;
  avatar_decoration_data: Nullable<AvatarDecorationData>;
  banner_color: Nullable<string>;
};

export type Chatlog = {
  keyHash: Buffer;
  iv: Buffer;
  authTag: Buffer;
  html: Buffer;
  guildId: string;
  expires: bigint;
};

export type Infraction = {
  id: number;
  userId: string;
  guildId: string;
  type: 'Warn' | 'Mute' | 'Kick' | 'Ban' | 'Unmute' | 'Unban';
  date: bigint;
  expires: bigint | null;
  reason: string;
  moderatorId?: string; // optional because it can be hidden
};

export type AppealEligibility = {
  appealAllowed: boolean;
  blacklisted: boolean;
  appealExists: boolean;
};

export type AppealSubmitQuestion = {
  question: string;
  response: string;
};
