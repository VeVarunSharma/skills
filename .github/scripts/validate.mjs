import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

const SCHEMA = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const REPOSITORY = "https://github.com/VeVarunSharma/skills";
const PLUGIN_NAME = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const MANIFEST_FIELDS = [
  "$schema", "name", "version", "description", "author", "homepage",
  "repository", "license", "keywords", "extensions",
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function validateRepository(directory) {
  const root = resolve(directory);
  const errors = [];
  const skillFiles = [];
  const result = { errors, pluginCount: 0, skillCount: 0 };
  const problem = (file, message) => errors.push(`${relative(root, file) || "."}: ${message}`);

  function requirePath(file, kind) {
    const local = relative(root, file);
    if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`)) {
      problem(file, "path must stay inside the repository");
      return false;
    }
    let current = root;
    for (const part of local.split(sep).filter(Boolean)) {
      const parent = lstatSync(current, { throwIfNoEntry: false });
      if (!parent || parent.isSymbolicLink() || !parent.isDirectory()) {
        problem(file, "parent must be a directory, not a symbolic link or junction");
        return false;
      }
      if (!readdirSync(current).includes(part)) {
        problem(file, `missing ${kind}; path spelling and case must match exactly`);
        return false;
      }
      current = join(current, part);
    }
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (!stat || stat.isSymbolicLink()) {
      problem(file, "missing path or symbolic link/junction; links are not allowed");
      return false;
    }
    if (kind === "directory" ? !stat.isDirectory() : !stat.isFile()) {
      problem(file, `expected a regular ${kind}`);
      return false;
    }
    return true;
  }

  function readText(file) {
    return requirePath(file, "file") ? readFileSync(file, "utf8") : undefined;
  }

  function readJson(file) {
    const text = readText(file);
    if (text === undefined) return undefined;
    let value;
    try {
      value = JSON.parse(text);
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      problem(file, `invalid JSON: ${error.message}`);
      return undefined;
    }
    // JSON.parse accepts duplicate keys; the YAML 1.2 parser detects them.
    const document = parseDocument(text, { schema: "json", uniqueKeys: true });
    if (document.errors.length) {
      problem(file, `invalid JSON metadata: ${document.errors.map((error) => error.message).join("; ")}`);
      return undefined;
    }
    return value;
  }

  function fields(value, allowed, label, file) {
    if (!isObject(value)) {
      problem(file, `${label} must be an object`);
      return false;
    }
    for (const key of Object.keys(value)) {
      if (!allowed.includes(key)) problem(file, `unknown ${label} field "${key}"`);
    }
    return true;
  }

  function text(value, label, file, max = Infinity) {
    if (typeof value !== "string" || !value.trim() || [...value].length > max) {
      problem(file, `${label} must be a non-empty string${max === Infinity ? "" : ` of at most ${max} characters`}`);
      return false;
    }
    return true;
  }

  function name(value, label, file, pattern = PLUGIN_NAME) {
    if (!text(value, label, file, 64)) return false;
    if (!pattern.test(value)) {
      problem(file, `${label} has invalid naming syntax`);
      return false;
    }
    return true;
  }

  function version(value, label, file) {
    const match = typeof value === "string" ? SEMVER.exec(value) : null;
    const validPrerelease = match && (!match[4] || match[4].split(".").every(
      (part) => !/^\d+$/.test(part) || part === "0" || !part.startsWith("0"),
    ));
    if (!validPrerelease) problem(file, `${label} must be a semantic version without a v prefix`);
  }

  function author(value, label, file, allowed) {
    if (!fields(value, allowed, label, file)) return;
    for (const key of Object.keys(value)) text(value[key], `${label}.${key}`, file);
  }

  function manifest(value, entry, file) {
    if (!fields(value, MANIFEST_FIELDS, "manifest", file)) return;
    if (value.$schema !== SCHEMA) problem(file, `"$schema" must be ${SCHEMA}`);
    name(value.name, "name", file);
    version(value.version, "version", file);
    text(value.description, "description", file, 1024);
    if (value.repository !== REPOSITORY) problem(file, `repository must be ${REPOSITORY}`);
    if (value.license !== "MIT") problem(file, "license must be MIT for this pack's original content");
    if ("homepage" in value) text(value.homepage, "homepage", file);
    if ("author" in value) author(value.author, "author", file, ["name", "email", "url"]);
    if ("keywords" in value) {
      if (!Array.isArray(value.keywords)) problem(file, "keywords must be an array of strings");
      else value.keywords.forEach((keyword) => text(keyword, "keyword", file));
    }
    if ("extensions" in value) {
      if (!isObject(value.extensions)) problem(file, "extensions must be an object");
      else {
        for (const [namespace, data] of Object.entries(value.extensions)) {
          if (!/^[a-z0-9]+(?:[.-][a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/.test(namespace) || !isObject(data)) {
            problem(file, "extensions must map reverse-domain namespaces to objects");
          }
        }
      }
    }
    for (const key of ["name", "version", "description"]) {
      if (value[key] !== entry[key]) problem(file, `${key} does not match the marketplace entry`);
    }
  }

  function checkTree(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isSymbolicLink()) problem(file, "symbolic links and junctions are not allowed in plugins");
      else if (entry.isDirectory()) checkTree(file);
      else if (!entry.isFile()) problem(file, "only regular files and directories are allowed in plugins");
    }
  }

  function skill(file, directoryName) {
    const raw = readText(file);
    if (raw === undefined) return;
    skillFiles.push(file);
    const markdown = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const match = /^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/.exec(markdown);
    if (!match) {
      problem(file, "expected YAML frontmatter between --- lines followed by Markdown instructions");
      return;
    }
    const document = parseDocument(match[1], { uniqueKeys: true });
    if (document.errors.length) {
      problem(file, `invalid YAML frontmatter: ${document.errors.map((error) => error.message).join("; ")}`);
      return;
    }
    let mapping;
    try {
      mapping = document.toJS({ mapAsMap: true, maxAliasCount: 50 });
    } catch (error) {
      problem(file, `invalid YAML frontmatter: ${error.message}`);
      return;
    }
    if (!(mapping instanceof Map) || [...mapping.keys()].some((key) => typeof key !== "string")) {
      problem(file, "frontmatter must be a mapping with string keys");
      return;
    }
    const value = Object.fromEntries(mapping);
    fields(value, ["name", "description", "license", "compatibility", "metadata", "allowed-tools"], "frontmatter", file);
    name(value.name, "skill name", file, SKILL_NAME);
    if (value.name !== directoryName) problem(file, "skill name must match its directory");
    text(value.description, "description", file, 1024);
    if ("license" in value) text(value.license, "license", file);
    if ("compatibility" in value) text(value.compatibility, "compatibility", file, 500);
    if ("allowed-tools" in value) text(value["allowed-tools"], "allowed-tools", file);
    if ("metadata" in value && (!(value.metadata instanceof Map) || [...value.metadata].some(
      ([key, item]) => typeof key !== "string" || typeof item !== "string",
    ))) {
      problem(file, "metadata must map string keys to string values");
    }
    if (!match[2].trim()) problem(file, "Markdown instruction body must not be empty");
  }

  function skills(pluginRoot) {
    const directory = join(pluginRoot, "skills");
    if (!requirePath(directory, "directory")) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.name === ".gitkeep" && entry.isFile()) continue;
      const file = join(directory, entry.name);
      if (!entry.isDirectory()) {
        problem(file, "expected an immediate skill directory or .gitkeep");
        continue;
      }
      name(entry.name, "skill directory name", file, SKILL_NAME);
      skill(join(file, "SKILL.md"), entry.name);
    }
  }

  function declaredCount(markdown, file, count) {
    const matches = [...markdown.matchAll(/^\*\*Implemented skills: (\d+)\.\*\*\r?$/gm)];
    if (matches.length !== 1 || Number(matches[0][1]) !== count) {
      problem(file, `declare exactly one "**Implemented skills: ${count}.**" line matching the skill files`);
    }
  }

  function readmeCatalog() {
    const file = join(root, "README.md");
    const markdown = readText(file);
    if (markdown === undefined) return;
    declaredCount(markdown, file, skillFiles.length);
    const heading = /^## Skill catalog\r?$/m.exec(markdown);
    if (!heading || !/^## Roadmap\r?$/m.test(markdown)) {
      problem(file, "keep separate Skill catalog and Roadmap sections");
      return;
    }
    const remainder = markdown.slice(heading.index + heading[0].length);
    const nextHeading = /^## /m.exec(remainder);
    const catalog = nextHeading ? remainder.slice(0, nextHeading.index) : remainder;
    const expected = new Set(skillFiles.map((skillFile) => relative(root, skillFile).split(sep).join("/")));
    const links = [...catalog.matchAll(/\[[^\]\r\n]*\]\(([^)\s]+)\)/g)].map((match) => match[1]);
    const listed = new Set();
    for (const link of links) {
      if (!expected.has(link)) problem(file, `Skill catalog link must point directly to an implemented SKILL.md: ${link}`);
      if (listed.has(link)) problem(file, `duplicate Skill catalog link: ${link}`);
      listed.add(link);
    }
    for (const link of expected) {
      if (!listed.has(link)) problem(file, `implemented skill is missing from Skill catalog: ${link}`);
    }
    for (const match of markdown.matchAll(/\[[^\]\r\n]*\]\(([^)\s]+)\)/g)) {
      const link = match[1].replace(/^\.\//, "").split("#")[0];
      if (link.startsWith("plugins/ve-skills/skills/") && !expected.has(link)) {
        problem(file, `do not link an unimplemented skill, including in Roadmap: ${link}`);
      }
    }
  }

  const catalogFile = join(root, ".github", "plugin", "marketplace.json");
  const catalog = readJson(catalogFile);
  if (catalog === undefined) return result;
  if (!fields(catalog, ["name", "owner", "metadata", "plugins"], "catalog", catalogFile)) return result;
  for (const parts of [["marketplace.json"], [".plugin", "marketplace.json"], [".claude-plugin", "marketplace.json"]]) {
    const file = join(root, ...parts);
    if (lstatSync(file, { throwIfNoEntry: false })) problem(file, "competing marketplace catalog is not allowed");
  }
  if (catalog.name !== "ve") problem(catalogFile, "marketplace name must be ve");
  author(catalog.owner, "owner", catalogFile, ["name", "email"]);
  if (catalog.owner?.name !== "VeVarunSharma") problem(catalogFile, "owner.name must be VeVarunSharma");
  if (fields(catalog.metadata, ["description", "version"], "metadata", catalogFile)) {
    text(catalog.metadata.description, "metadata.description", catalogFile, 1024);
    if ("version" in catalog.metadata) version(catalog.metadata.version, "metadata.version", catalogFile);
  }
  if (!Array.isArray(catalog.plugins)) {
    problem(catalogFile, "plugins must be an array");
    return result;
  }
  result.pluginCount = catalog.plugins.length;
  if (catalog.plugins.length !== 1) problem(catalogFile, "this marketplace must contain exactly one ve-skills pack");
  const license = readText(join(root, "LICENSE"));
  const names = new Set();
  for (const entry of catalog.plugins) {
    if (!fields(entry, ["name", "source", "version", "description"], "plugin entry", catalogFile)) continue;
    if (!name(entry.name, "plugin entry name", catalogFile)) continue;
    if (entry.name !== "ve-skills") problem(catalogFile, "plugin entry name must be ve-skills");
    if (names.has(entry.name)) problem(catalogFile, `duplicate plugin entry: ${entry.name}`);
    names.add(entry.name);
    version(entry.version, "plugin entry version", catalogFile);
    text(entry.description, "plugin entry description", catalogFile, 1024);
    if (catalog.metadata?.description !== entry.description) problem(catalogFile, "metadata.description must match the plugin description");
    if (entry.source !== `./plugins/${entry.name}`) {
      problem(catalogFile, `source must equal ./plugins/${entry.name}; remote, absolute, and traversing sources are not supported`);
      continue;
    }
    const pluginRoot = join(root, "plugins", entry.name);
    if (!requirePath(pluginRoot, "directory")) continue;
    checkTree(pluginRoot);
    const file = join(pluginRoot, "plugin.json");
    const value = readJson(file);
    if (value !== undefined) manifest(value, entry, file);
    const licenseFile = join(pluginRoot, "LICENSE");
    const packagedLicense = readText(licenseFile);
    if (license !== undefined && packagedLicense !== undefined && packagedLicense !== license) {
      problem(licenseFile, "packaged license must match the repository LICENSE");
    }
    const previousCount = skillFiles.length;
    skills(pluginRoot);
    const readmeFile = join(pluginRoot, "README.md");
    const readme = readText(readmeFile);
    if (readme !== undefined) declaredCount(readme, readmeFile, skillFiles.length - previousCount);
  }
  const pluginsDirectory = join(root, "plugins");
  if (requirePath(pluginsDirectory, "directory")) {
    for (const entry of readdirSync(pluginsDirectory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (entry.isDirectory() && !names.has(entry.name))) {
        problem(join(pluginsDirectory, entry.name), "unregistered plugin directory or symbolic link/junction");
      }
    }
  }
  readmeCatalog();
  result.skillCount = skillFiles.length;
  return result;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = validateRepository(resolve(dirname(fileURLToPath(import.meta.url)), "..", ".."));
    if (result.errors.length) {
      console.error(`Validation failed:\n${result.errors.map((error) => `- ${error}`).join("\n")}`);
      process.exitCode = 1;
    } else {
      console.log(`Validation passed: ${result.pluginCount} plugin, ${result.skillCount} implemented skills.`);
      console.log("Structural checks only; no client installation or skill behavior tested.");
    }
  } catch (error) {
    console.error(`Validation could not finish: ${error.message}`);
    process.exitCode = 1;
  }
}
