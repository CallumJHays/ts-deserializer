import { Deserializeable, deserializer } from "./deserialize";

class TestType implements Deserializeable {
  bool: boolean;
  number: number;
  string: string;
  inner: {
    bool: boolean;
    number: number;
    string: string;
  };
  subType: {
    number: number;
    date: Date;
  };

  date: Date;
  rebind: { inner: object };

  static deserialize = deserializer<TestType>([
    {
      date: Date,
      // so unfortunately manual type ascription seems inevitable for now - no worries
      subType: ({ date }: { date: string }) => ({ date: new Date(date) })
    },
    {
      rebind: (_, { inner }) => ({ inner })
    }
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
      number: 2352323,
      date: new Date(424234525)
    },
    date: new Date(87685658),
    rebind: { inner }
  };

  const serialized = JSON.parse(JSON.stringify(orig));

  const deser = TestType.deserialize(serialized);

  test("jsonAttrs get deserialized as expected", () => {
    expect(deser.bool === orig.bool);
    expect(deser.number === orig.number);
    expect(deser.string === orig.string);
  });

  test("innerObjects get deserialized as expected", () => {
    expect(deser.inner.bool === inner.bool);
    expect(deser.inner.number === inner.number);
    expect(deser.inner.string === inner.string);
  });

  test("immediate deserializers work", () => {
    expect(deser.date === orig.date);
  });

  test("rebinding during deserialization works", () => {
    expect(deser.rebind.inner == deser.inner); // note == instead of === to check for object reference equality
  });

  test("subType deserializers work", () => {
    expect(deser.subType.number === orig.subType.number);
    expect(deser.subType.date === orig.subType.date);
  });
});
