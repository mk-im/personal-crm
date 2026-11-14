const { ServerResponse } = require("node:http");

const hidden = new Set([
  "x-powered-by",
  "x-nextjs-cache",
  "x-nextjs-prerender",
  "x-nextjs-stale-time",
  "x-nextjs-postponed",
]);

function visible(name) {
  return !hidden.has(String(name).toLowerCase());
}

function dropHidden(response) {
  for (const name of hidden) {
    if (response.hasHeader(name)) {
      response.removeHeader(name);
    }
  }
}

function dropFromObject(headers) {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return;
  }

  for (const name of Object.keys(headers)) {
    if (!visible(name)) {
      delete headers[name];
      continue;
    }

    if (name.toLowerCase() === "vary") {
      const cleaned = cleanVary(headers[name]);
      if (cleaned.length === 0) {
        delete headers[name];
      } else {
        headers[name] = cleaned;
      }
    }
  }
}

function cleanVary(value) {
  const parts = (Array.isArray(value) ? value : [value])
    .join(",")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && !part.toLowerCase().includes("next"));

  return parts.join(", ");
}

const setHeader = ServerResponse.prototype.setHeader;
ServerResponse.prototype.setHeader = function (name, value) {
  if (!visible(name)) {
    return this;
  }

  if (String(name).toLowerCase() === "vary") {
    const cleaned = cleanVary(value);
    if (cleaned.length === 0) {
      return this;
    }
    return setHeader.call(this, name, cleaned);
  }

  return setHeader.call(this, name, value);
};

if (typeof ServerResponse.prototype.appendHeader === "function") {
  const appendHeader = ServerResponse.prototype.appendHeader;
  ServerResponse.prototype.appendHeader = function (name, value) {
    if (!visible(name)) {
      return this;
    }

    if (String(name).toLowerCase() === "vary") {
      const cleaned = cleanVary(value);
      if (cleaned.length === 0) {
        return this;
      }
      return appendHeader.call(this, name, cleaned);
    }

    return appendHeader.call(this, name, value);
  };
}

const writeHead = ServerResponse.prototype.writeHead;
ServerResponse.prototype.writeHead = function (statusCode, statusMessage, headers) {
  dropHidden(this);
  dropFromObject(statusMessage);
  dropFromObject(headers);
  return writeHead.apply(this, arguments);
};
