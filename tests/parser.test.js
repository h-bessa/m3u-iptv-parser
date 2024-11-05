// tests/parser.test.js
const M3UParser = require("../src/parser");

describe("M3UParser", () => {
  let parser;

  beforeEach(() => {
    parser = new M3UParser();
  });

  const validHeader = `#EXTM3U x-tvg-url="http://example.com/epg.xml.gz"`;
  const validItem = `#EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD" tvg-logo="http://example.com/logo.png" group-title="FRANCE HD",TF1 HD
  http://example.com/stream`;

  const vlcOptions = `#EXTVLCOPT:http-referrer=http://example.com/
  #EXTVLCOPT:http-user-agent=Mozilla/5.0`;

  const invalidHeader = `#INVALID_HEADER
  #EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD",TF1 HD
  http://example.com/stream`;

  const groupAttribute = `#EXTGRP:FRANCE TV`;

  test("should throw an error if playlist is not valid", () => {
    expect(() => {
      parser.parse(invalidHeader);
    }).toThrow("Playlist is not valid");
  });

  test("should correctly parse header attributes", () => {
    const data = `${validHeader}
    ${validItem}`;

    parser.parse(data);
    const header = parser.getHeader();

    expect(header).toEqual({
      attrs: {
        "x-tvg-url": "http://example.com/epg.xml.gz",
      },
      raw: validHeader,
    });
  });

  test("should parse items correctly", () => {
    const data = `#EXTM3U
    ${validItem}`;

    parser.parse(data);
    const items = parser.getItems();

    expect(items).toEqual([
      {
        name: "TF1 HD",
        tvg: {
          id: "tf1.fr",
          name: "TF1 HD",
          logo: "http://example.com/logo.png",
          url: "",
          shift: ""
        },
        group: {
          title: "FRANCE HD"
        },
        http: {
          referrer: "",
          "user-agent": ""
        },
        url: "http://example.com/stream",
        raw: expect.any(String),
        line: 2,
        catchup: {
          type: "",
          days: "",
          source: ""
        },
        timeshift: ""
      }
    ]);
  });

  test("should parse EXTGRP attribute correctly", () => {
    const data = `#EXTM3U
    #EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD",TF1 HD
    ${groupAttribute}
    http://example.com/stream`;

    parser.parse(data);
    const items = parser.getItems();

    expect(items[0].group.title).toBe("FRANCE TV");
  });

  test("should parse EXTVLCOPT attributes correctly", () => {
    const data = `#EXTM3U
    #EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD",TF1 HD
    ${vlcOptions}
    http://example.com/stream`;

    parser.parse(data);
    const items = parser.getItems();

    expect(items[0].http).toEqual({
      referrer: "http://example.com/",
      "user-agent": "Mozilla/5.0",
    });
  });

  test("should ignore invalid URLs or paths", () => {
    const data = `#EXTM3U
    #EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD",TF1 HD
    INVALID_URL`;

    parser.parse(data);
    const items = parser.getItems();

    expect(items[0].url).toBe(undefined);
  });

  test("should parse multiple items", () => {
    const data = `#EXTM3U
    #EXTINF:-1 tvg-id="tf1.fr" tvg-name="TF1 HD" group-title="FRANCE HD",TF1 HD
    http://example.com/stream1
    #EXTINF:-1 tvg-id="france2.fr" tvg-name="FRANCE 2",FRANCE 2
    http://example.com/stream2`;

    parser.parse(data);
    const items = parser.getItems();

    expect(items.length).toBe(2);
    expect(items[0].name).toBe("TF1 HD");
    expect(items[1].name).toBe("FRANCE 2");
  });
});
