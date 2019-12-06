type RawJson =
  | string
  | number
  | boolean
  | { [key: string]: RawJson }
  | RawJson[];
export type Json<T> = { [K in keyof T]?: RawJson };

type JsonPropDeserializer<T> = (json: RawJson, rest?: Json<T>) => any;

// todo: make this class Serde and (duh) implement generic serialization too!
export abstract class Deserializeable {
  static deserialize: <T>(json: Json<T>) => ThisType<T>;
}

// don't use directly. Convert your types to a class that extends Deserializable and implements the static `deserialize` method,
// then use the Class.deserialize function when doing deserialization. Wish we had traits instead of classes to let type inference do this magic for us :'(
export const deserializer = <T>(deserializers: {
  [key: string]: JsonPropDeserializer<T>;
  // unfortunately [K in keyof T]? still causes TS to think that T can only contain the keys included in deserializers, even though it's supposed to be a partial???
  // because of this, we can't verify with duck-type safety that deserializer implementations conform to the output type we're expecting.
  // luckily, this shouldn't be too much of an issue, as this kind of thing throws a typeError in development mode during runtime
}) => (json: Json<T>): T =>
  [...Object.entries(deserializers)].reduce(
    (
      deserialized,
      [key, propDeserializer]: [string, JsonPropDeserializer<T>]
    ) => ({
      ...deserialized,
      [key]: propDeserializer(json[key], json)
    }),
    json
  ) as T;
