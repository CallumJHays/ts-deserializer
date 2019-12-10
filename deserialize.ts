type RawJson =
  | string
  | number
  | boolean
  | { [key: string]: RawJson }
  | RawJson[];
export type Json<T> = { [K in keyof T]?: RawJson | T[K] };

type JsonPropDeserializer<T> = (json: RawJson, rest?: Json<T>) => any;

// if types existed at runtime, this would be abstract. But we need the identifier at runtime to confirm stuff because typescript isn't perfect
// todo: make this class Serde and (duh) implement generic serialization too! (for things with self-referential bindings)
export class Deserializeable {
  static deserialize: (json: Json<any>) => any;
}

// don't use directly. Convert your types to a class that extends Deserializable and implements the static `deserialize` method,
// then use the Class.deserialize function when doing deserialization. Wish we had traits instead of classes to let type inference do this magic for us :'(
export const deserializer = <T>(
  deserializers: {
    [key: string]: // unfortunately [K in keyof T]? still causes TS to think that T can only contain the keys included in deserializers, even though it's supposed to be a partial???
    // because of this, we can't verify with duck-type safety that deserializer implementations conform to the output type we're expecting.
    // this means testing deserialize implementations are still necessary :'(
    | JsonPropDeserializer<T>
      // | typeof Date // used to have a class-constructor type here but couldn't think of anything else that would actually need it
      | typeof Deserializeable; // a class that implements Deserializeable
  }[]
) => {
  // normalize it so that class-constructor-based deserializers (such as Date) only impose reflection overhead at deserializer definition time
  const normalizedDeserializers: {
    [key: string]: JsonPropDeserializer<T>;
  }[] = deserializers.map(deserializerMap =>
    Object.entries(deserializerMap).reduce(
      (
        normalizedDeserializers,
        [key, deserializer]: [
          string,
          JsonPropDeserializer<T> | typeof Deserializeable | typeof Date
        ]
      ) => ({
        ...normalizedDeserializers,
        [key]:
          deserializer.prototype instanceof Deserializeable
            ? (deserializer as typeof Deserializeable).deserialize
            : deserializer === Date
            ? (dateVal: string | number) => new Date(dateVal)
            : deserializer
      }),
      {}
    )
  );

  return (json: Json<T>) =>
    normalizedDeserializers.reduce(
      (deserialized, deserializerMap) =>
        Object.entries(deserializerMap).reduce(
          (
            deserialized,
            [key, deserializer]: [string, JsonPropDeserializer<T>]
          ) =>
            merge(deserialized, {
              [key]: deserializer(deserialized[key], deserialized)
            }),
          deserialized
        ),
      json
    ) as T;
};

const merge = <T>(
  obj: T,
  child: any,
  refs = Object.values(obj).filter(val => typeof val === "object")
) => {
  Object.entries(child).forEach(([key, val]) => {
    if (
      typeof val === "object" &&
      !(val instanceof Date) &&
      !refs.find(ref => obj === ref)
    ) {
      merge(obj[key], val, refs);
    } else {
      obj[key] = val;
    }
  });
  return obj;
};
