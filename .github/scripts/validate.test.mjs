import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { validateRepository } from "./validate.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "ve-skills-test-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const catalog = join(root, ".github", "plugin", "marketplace.json");
  const pluginRoot = join(root, "plugins", "ve-skills");
  const manifest = join(pluginRoot, "plugin.json");
  function write(file, value) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
  }
  function editJson(file, edit) {
    const value = JSON.parse(readFileSync(file, "utf8"));
    edit(value);
    write(file, value);
  }
  function readmes(names = []) {
    const count = `**Implemented skills: ${names.length}.**`;
    write(join(pluginRoot, "README.md"), `# Test plugin\n\n${count}\n`);
    const links = names.map((name) => `[${name}](plugins/ve-skills/skills/${name}/SKILL.md)`).join("\n");
    write(join(root, "README.md"), `# Test marketplace\n\n## Skill catalog\n\n${count}\n\n${links}\n\n## Roadmap\n\nPlanned, not implemented.\n`);
  }
  function addSkill(name = "summarize-notes", contents) {
    const file = join(pluginRoot, "skills", name, "SKILL.md");
    write(file, contents ?? `---\nname: ${name}\ndescription: Summarize supplied notes when a short recap is requested.\n---\nSummarize only the notes supplied by the user.\n`);
    readmes([name]);
    return file;
  }
  write(catalog, {
    name: "ve",
    owner: { name: "VeVarunSharma" },
    metadata: { description: "Test skill pack." },
    plugins: [{ name: "ve-skills", source: "./plugins/ve-skills", version: "0.1.0", description: "Test skill pack." }],
  });
  write(manifest, {
    $schema: "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    name: "ve-skills",
    version: "0.1.0",
    description: "Test skill pack.",
    repository: "https://github.com/VeVarunSharma/skills",
    license: "MIT",
  });
  write(join(pluginRoot, "skills", ".gitkeep"), "");
  write(join(root, "LICENSE"), "Test license notice.\n");
  write(join(pluginRoot, "LICENSE"), "Test license notice.\n");
  readmes();
  return { root, catalog, pluginRoot, manifest, write, editJson, readmes, addSkill };
}

function errors(f) {
  return validateRepository(f.root).errors.join("\n");
}

test("an intentional zero-skill foundation is valid", (t) => {
  const f = fixture(t);
  assert.deepEqual(validateRepository(f.root), { errors: [], pluginCount: 1, skillCount: 0 });
});

test("legacy marketplace and plugin identities are rejected", async (t) => {
  await t.test("marketplace", (t) => {
    const f = fixture(t);
    f.editJson(f.catalog, (catalog) => { catalog.name = "varun"; });
    assert.match(errors(f), /marketplace name must be ve/);
  });
  await t.test("plugin", (t) => {
    const f = fixture(t);
    f.editJson(f.catalog, (catalog) => {
      catalog.plugins[0].name = "varun-skills";
      catalog.plugins[0].source = "./plugins/varun-skills";
    });
    f.editJson(f.manifest, (manifest) => { manifest.name = "varun-skills"; });
    renameSync(f.pluginRoot, join(f.root, "plugins", "varun-skills"));
    assert.match(errors(f), /plugin entry name must be ve-skills/);
  });
});

test("a real skill supports CRLF, folded descriptions, and string metadata", (t) => {
  const f = fixture(t);
  f.addSkill("summarize-notes", [
    "---", "name: summarize-notes", "description: >-",
    "  Summarize supplied notes.", "  Use when a short recap is requested.",
    "metadata:", '  revision: "1"', "---", "Summarize only the supplied notes.", "",
  ].join("\r\n"));
  assert.deepEqual(validateRepository(f.root), { errors: [], pluginCount: 1, skillCount: 1 });
});

test("malformed and duplicate-key JSON fail explicitly", async (t) => {
  for (const [label, contents] of [
    ["syntax", '{"name": "ve",}'],
    ["duplicate keys", '{"name":"ve","name":"replacement","plugins":[]}'],
    ["escaped duplicate keys", '{"name":"ve","\\u006eame":"replacement"}'],
  ]) {
    await t.test(label, (t) => {
      const f = fixture(t);
      f.write(f.catalog, contents);
      assert.match(errors(f), /marketplace\.json: invalid JSON/);
    });
  }
});

test("manifest schema, fields, types, and catalog versions are checked", async (t) => {
  const cases = [
    ["unsupported schema", (m) => { m.$schema = "https://agent-plugins.org/schemas/9.0.0/plugin.schema.json"; }, /"\$schema" must be/],
    ["legacy component field", (m) => { m.skills = ["./skills"]; }, /unknown manifest field "skills"/],
    ["wrong description type", (m) => { m.description = []; }, /description must be a non-empty string/],
    ["invalid name", (m) => { m.name = "Ve--Skills"; }, /name has invalid naming syntax/],
    ["version mismatch", (m) => { m.version = "0.2.0"; }, /version does not match/],
    ["invalid prerelease version", (m) => { m.version = "0.1.0-01"; }, /semantic version/],
    ["invalid author", (m) => { m.author = { url: 12 }; }, /author.url must be a non-empty string/],
    ["invalid extension", (m) => { m.extensions = { copilot: [] }; }, /reverse-domain namespaces/],
  ];
  for (const [label, mutate, expected] of cases) {
    await t.test(label, (t) => {
      const f = fixture(t);
      f.editJson(f.manifest, mutate);
      assert.match(errors(f), expected);
    });
  }
});

test("a plugin source cannot escape or reinterpret the fixed local location", async (t) => {
  for (const source of ["../outside", "/outside", "C:\\outside", "./plugins/../ve-skills", "https://example.com/plugin.git"]) {
    await t.test(source, (t) => {
      const f = fixture(t);
      f.editJson(f.catalog, (catalog) => { catalog.plugins[0].source = source; });
      assert.match(errors(f), /source must equal \.\/plugins\/ve-skills/);
    });
  }
});

test("missing, duplicate, unregistered, and shadowed plugins are rejected", async (t) => {
  const cases = [
    ["missing source", (f) => rmSync(f.pluginRoot, { recursive: true }), /missing directory/],
    ["missing manifest", (f) => rmSync(f.manifest), /plugin\.json: missing file/],
    ["missing packaged license", (f) => rmSync(join(f.pluginRoot, "LICENSE")), /LICENSE: missing file/],
    ["mismatched packaged license", (f) => f.write(join(f.pluginRoot, "LICENSE"), "Different notice."), /packaged license must match/],
    ["duplicate entry", (f) => f.editJson(f.catalog, (catalog) => catalog.plugins.push(catalog.plugins[0])), /duplicate plugin entry/],
    ["unregistered directory", (f) => mkdirSync(join(f.root, "plugins", "unregistered")), /unregistered plugin directory/],
    ["shadow catalog", (f) => f.write(join(f.root, "marketplace.json"), {}), /competing marketplace catalog/],
    ["component override", (f) => f.editJson(f.catalog, (catalog) => { catalog.plugins[0].skills = "elsewhere"; }), /unknown plugin entry field "skills"/],
  ];
  for (const [label, mutate, expected] of cases) {
    await t.test(label, (t) => {
      const f = fixture(t);
      mutate(f);
      assert.match(errors(f), expected);
    });
  }
});

test("skill folders require a case-exact SKILL.md, not empty or nested placeholders", async (t) => {
  await t.test("empty folder", (t) => {
    const f = fixture(t);
    mkdirSync(join(f.pluginRoot, "skills", "placeholder"));
    assert.match(errors(f), /SKILL\.md: missing file/);
  });
  await t.test("wrong case", (t) => {
    const f = fixture(t);
    const file = f.addSkill();
    renameSync(file, join(dirname(file), "skill.md"));
    assert.match(errors(f), /SKILL\.md: missing file/);
  });
  await t.test("nested skill", (t) => {
    const f = fixture(t);
    f.write(join(f.pluginRoot, "skills", "family", "nested", "SKILL.md"), "---\nname: nested\ndescription: Test.\n---\nTest instructions.");
    assert.match(errors(f), /SKILL\.md: missing file/);
  });
});

test("invalid skill frontmatter and empty instructions cannot pass", async (t) => {
  const cases = [
    ["broken YAML", "---\nname: summarize-notes\ndescription: [unfinished\n---\nInstructions.", /invalid YAML frontmatter/],
    ["duplicate YAML field", "---\nname: summarize-notes\nname: duplicate\ndescription: Test.\n---\nInstructions.", /invalid YAML frontmatter/],
    ["directory mismatch", "---\nname: different\ndescription: Test.\n---\nInstructions.", /skill name must match/],
    ["long description", `---\nname: summarize-notes\ndescription: ${"a".repeat(1025)}\n---\nInstructions.`, /description.*at most 1024/],
    ["non-string description", "---\nname: summarize-notes\ndescription: false\n---\nInstructions.", /description must be/],
    ["numeric metadata", "---\nname: summarize-notes\ndescription: Test.\nmetadata:\n  revision: 1\n---\nInstructions.", /metadata must map string keys to string values/],
    ["numeric metadata key", "---\nname: summarize-notes\ndescription: Test.\nmetadata:\n  1: text\n---\nInstructions.", /metadata must map string keys to string values/],
    ["empty body", "---\nname: summarize-notes\ndescription: Test.\n---\n", /instruction body must not be empty/],
  ];
  for (const [label, contents, expected] of cases) {
    await t.test(label, (t) => {
      const f = fixture(t);
      f.addSkill("summarize-notes", contents);
      assert.match(errors(f), expected);
    });
  }
});

test("skill counts and catalog links must reflect actual skill files", async (t) => {
  await t.test("unlisted implementation", (t) => {
    const f = fixture(t);
    f.addSkill();
    f.readmes();
    assert.match(errors(f), /Implemented skills: 1/);
    assert.match(errors(f), /implemented skill is missing from Skill catalog/);
  });
  await t.test("nonexistent roadmap link", (t) => {
    const f = fixture(t);
    const readme = join(f.root, "README.md");
    f.write(readme, `${readFileSync(readme, "utf8")}\n[Planned](plugins/ve-skills/skills/planned/SKILL.md)\n`);
    assert.match(errors(f), /do not link an unimplemented skill/);
  });
});

test("plugin trees reject symlinks and Windows junctions instead of following them", (t) => {
  const f = fixture(t);
  const target = join(f.root, "outside-plugin");
  mkdirSync(target);
  try {
    symlinkSync(target, join(f.pluginRoot, "skills", "escape"), "junction");
  } catch (error) {
    if (error.code !== "EPERM") throw error;
    t.skip("The host does not permit creation of a test symlink/junction.");
    return;
  }
  assert.match(errors(f), /symbolic links and junctions are not allowed/);
});
