const {
  getName,
  getAttribute,
  getOption,
  getValue,
  getURL,
  getParameter,
} = require("./utils/parserUtils");

class M3UParser {
  constructor() {
    this.items = [];
    this.header = null;
  }

  parse(data) {
    const lines = data.split("\n").map(parseLine);
    const firstLine = lines.find((l) => l.index === 0 && l.raw.trim().startsWith("#EXTM3U"));

    if (!firstLine || !/^#EXTM3U/.test(firstLine.raw)) {
      throw new Error("Playlist is not valid");
    }

    this.header = parseHeader(firstLine);

    let i = 0;
    const items = {};

    lines.forEach((line) => {
      const string = line.raw.toString().trim();
      if (line.index === 0) return;

      if (string.startsWith("#EXTINF:")) {
        const EXTINF = string;
        items[i] = {
          name: getName(EXTINF),
          tvg: {
            id: getAttribute(EXTINF, "tvg-id"),
            name: getAttribute(EXTINF, "tvg-name"),
            logo: getAttribute(EXTINF, "tvg-logo"),
            url: getAttribute(EXTINF, "tvg-url"),
            shift: getAttribute(EXTINF, "tvg-shift"),
          },
          group: {
            title: getAttribute(EXTINF, "group-title"),
          },
          http: {
            referrer: "",
            "user-agent": getAttribute(EXTINF, "user-agent"),
          },
          url: undefined,
          raw: line.raw,
          line: line.index + 1,
          catchup: {
            type: getAttribute(EXTINF, "catchup"),
            days: getAttribute(EXTINF, "catchup-days"),
            source: getAttribute(EXTINF, "catchup-source"),
          },
          timeshift: getAttribute(EXTINF, "timeshift"),
        };
      } else if (string.startsWith("#EXTVLCOPT:")) {
        if (!items[i]) return;
        const EXTVLCOPT = string;
        items[i].http.referrer = getOption(EXTVLCOPT, "http-referrer") || items[i].http.referrer;
        items[i].http["user-agent"] = getOption(EXTVLCOPT, "http-user-agent") || items[i].http["user-agent"];
        items[i].raw += `\r\n${line.raw}`;
      } else if (string.startsWith("#EXTGRP:")) {
        if (!items[i]) return;
        const EXTGRP = string;
        items[i].group.title = getValue(EXTGRP) || items[i].group.title;
        items[i].raw += `\r\n${line.raw}`;
      } else {
        if (!items[i]) return;
        const url = getURL(string);
        const user_agent = getParameter(string, "user-agent");
        const referrer = getParameter(string, "referer");

        if (url && isValidUrl(url)) {
          items[i].url = url;
          items[i].http["user-agent"] = user_agent || items[i].http["user-agent"];
          items[i].http.referrer = referrer || items[i].http.referrer;
          items[i].raw += `\r\n${line.raw}`;
          i++;
        } else {
          if (!items[i]) return;
          items[i].raw += `\r\n${line.raw}`;
        }
      }
    });

    this.items = Object.values(items);
  }

  getItems() {
    return this.items;
  }

  getHeader() {
    return this.header;
  }
}

function parseLine(line, index) {
  return {
    index,
    raw: line,
  };
}

function parseHeader(line) {
  const supportedAttrs = ["x-tvg-url", "url-tvg"];
  const attrs = {};

  supportedAttrs.forEach((attr) => {
    const value = getAttribute(line.raw, attr);
    if (value) {
      attrs[attr] = value;
    }
  });

  return {
    attrs,
    raw: line.raw,
  };
}

function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch (e) {
    return false;
  }
}

module.exports = M3UParser;
