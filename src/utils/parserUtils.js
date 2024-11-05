function getName(string) {
  let info = string.replace(/\="(.*?)"/g, "");
  let parts = info.split(/,(.*)/);
  return parts[1] || "";
}

function getAttribute(string, name) {
  let regex = new RegExp(name + '="(.*?)"', "gi");
  let match = regex.exec(string);
  return match && match[1] ? match[1] : "";
}

function getOption(string, name) {
  let regex = new RegExp(":" + name + "=(.*)", "gi");
  let match = regex.exec(string);
  return match && match[1] && typeof match[1] === "string" ? match[1].replace(/\"/g, "") : "";
}

function getValue(string) {
  let regex = new RegExp(":(.*)", "gi");
  let match = regex.exec(string);
  return match && match[1] && typeof match[1] === "string" ? match[1].replace(/\"/g, "") : "";
}

function getURL(string) {
  return string.split("|")[0] || "";
}

function getParameter(string, name) {
  const params = string.replace(/^(.*)\|/, "");
  const regex = new RegExp(name + "=(\\w[^&]*)", "gi");
  const match = regex.exec(params);
  return match && match[1] ? match[1] : "";
}

module.exports = {
  getName,
  getAttribute,
  getOption,
  getValue,
  getURL,
  getParameter,
};
