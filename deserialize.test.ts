import { Deserializeable, deserializer } from "./deserialize";

class SubType extends Deserializeable {
  number: number;
  date: Date;

  static deserialize = deserializer<SubType>([{ date: Date }]);
}

class TestType extends Deserializeable {
  bool: boolean;
  number: number;
  string: string;
  inner: {
    bool: boolean;
    number: number;
    string: string;
  };
  subType: SubType;
  nested: {
    number: number;
    date: Date;
  };

  date: Date;
  rebind: { inner: object };

  static deserialize = deserializer<TestType>([
    {
      // Date is special. deal with it.
      date: Date,

      // the `deserializer` will normalize below to SubType.deserialize if SubType is Deserializeable
      subType: SubType,

      // nested struct deserialization can be implemented like so, it's a little uglier, thankfully subTypes are more common
      nested: ({ date }: { date: string }) => ({ date: new Date(date) })
    },

    // rebinding generally wants to happen after all other types within the object have been deserialized, so it happens at a different stage
    { rebind: (_, { inner }) => ({ inner }) }
  ]);
}

describe("Deserializeable", () => {
  const inner = {
    bool: false,
    number: 9870980,
    string: "you and what army?"
  };

  const orig: TestType = {
    bool: true,
    number: 3434234,
    string: "im the joker baby",
    inner,
    subType: {
      number: 5443433,
      date: new Date(767567575)
    },
    nested: {
      number: 2352323,
      date: new Date(424234525)
    },
    date: new Date(87685658),
    rebind: { inner }
  };

  const serialized = JSON.parse(JSON.stringify(orig));

  const deser = TestType.deserialize(serialized);

  test("jsonAttrs get deserialized as expected", () => {
    expect(deser.bool).toEqual(orig.bool);
    expect(deser.number).toEqual(orig.number);
    expect(deser.string).toEqual(orig.string);
  });

  test("innerObjects get deserialized as expected", () => {
    expect(deser.inner.bool).toEqual(inner.bool);
    expect(deser.inner.number).toEqual(inner.number);
    expect(deser.inner.string).toEqual(inner.string);
  });

  test("class-constructor deserializers work", () => {
    console.log(deser.date, typeof deser.date);
    console.log(orig.date, typeof orig.date);
    expect(deser.date).toEqual(orig.date);
    expect(deser.date).toBeInstanceOf(Date);
  });

  test("rebinding during deserialization works", () => {
    console.log(deser.rebind.inner === deser.inner);
    expect(deser.rebind.inner).toBe(deser.inner);
  });

  test("subType classname deserializers work", () => {
    expect(deser.subType.number).toEqual(orig.subType.number);
    expect(deser.subType.date).toEqual(orig.subType.date);
  });

  test("nested struct deserializers work", () => {
    expect(deser.nested.number).toEqual(orig.nested.number);
    expect(deser.nested.date).toEqual(orig.nested.date);
  });
});
