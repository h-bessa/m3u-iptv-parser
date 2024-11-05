const { isURL: isValidUrl } = require('validator');
const isValidPath = require('is-valid-path');

class M3UParser {
  constructor() {
    this.items = [];
    this.header = null;
  }

  parse(data) {
    const lines = data.split("\n").map(parseLine);
    const firstLine = lines.find((l) => l.index === 0);

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
          name: EXTINF.getName(),
          tvg: {
            id: EXTINF.getAttribute("tvg-id"),
            name: EXTINF.getAttribute("tvg-name"),
            logo: EXTINF.getAttribute("tvg-logo"),
            url: EXTINF.getAttribute("tvg-url"),
            shift: EXTINF.getAttribute("tvg-shift"),
          },
          group: {
            title: EXTINF.getAttribute("group-title"),
          },
          http: {
            referrer: "",
            "user-agent": EXTINF.getAttribute("user-agent"),
          },
          url: undefined,
          raw: line.raw,
          line: line.index + 1,
          catchup: {
            type: EXTINF.getAttribute("catchup"),
            days: EXTINF.getAttribute("catchup-days"),
            source: EXTINF.getAttribute("catchup-source"),
          },
          timeshift: EXTINF.getAttribute("timeshift"),
        };
      } else if (string.startsWith("#EXTVLCOPT:")) {
        if (!items[i]) return;
        const EXTVLCOPT = string;
        items[i].http.referrer = EXTVLCOPT.getOption("http-referrer") || items[i].http.referrer;
        items[i].http["user-agent"] = EXTVLCOPT.getOption("http-user-agent") || items[i].http["user-agent"];
        items[i].raw += `\r\n${line.raw}`;
      } else if (string.startsWith("#EXTGRP:")) {
        if (!items[i]) return;
        const EXTGRP = string;
        items[i].group.title = EXTGRP.getValue() || items[i].group.title;
        items[i].raw += `\r\n${line.raw}`;
      } else {
        if (!items[i]) return;
        const url = string.getURL();
        const user_agent = string.getParameter("user-agent");
        const referrer = string.getParameter("referer");

        if (url && (isValidPath(url) || isValidUrl(url))) {
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

  let attrs = {};
  for (let attrName of supportedAttrs) {
    const tvgUrl = line.raw.getAttribute(attrName);
    if (tvgUrl) {
      attrs[attrName] = tvgUrl;
    }
  }

  return {
    attrs,
    raw: line.raw,
  };
}

// Ajouter des méthodes utiles à String
String.prototype.getName = function () {
  let info = this.replace(/\="(.*?)"/g, "");
  let parts = info.split(/,(.*)/);
  return parts[1] || "";
};

String.prototype.getAttribute = function (name) {
  let regex = new RegExp(name + '="(.*?)"', "gi");
  let match = regex.exec(this);
  return match && match[1] ? match[1] : "";
};

String.prototype.getOption = function (name) {
  let regex = new RegExp(":" + name + "=(.*)", "gi");
  let match = regex.exec(this);
  return match && match[1] && typeof match[1] === "string" ? match[1].replace(/\"/g, "") : "";
};

String.prototype.getValue = function () {
  let regex = new RegExp(":(.*)", "gi");
  let match = regex.exec(this);
  return match && match[1] && typeof match[1] === "string" ? match[1].replace(/\"/g, "") : "";
};

String.prototype.getURL = function () {
  return this.split("|")[0] || "";
};

String.prototype.getParameter = function (name) {
  const params = this.replace(/^(.*)\|/, "");
  const regex = new RegExp(name + "=(\\w[^&]*)", "gi");
  const match = regex.exec(params);
  return match && match[1] ? match[1] : "";
};

module.exports = M3UParser;
