# Contributing

Agree on the task, expected output, users, supported clients, and boundaries before adding a skill. [Roadmap](README.md#roadmap) items need scope first. Do not create placeholder skills.

## Author in the plugin

```text
plugins/
  ve-skills/
    skills/
      your-skill-name/
        SKILL.md
        references/  (only if needed)
        scripts/     (only if needed)
        assets/      (only if needed and redistributable)
```

Skills live in immediate child folders, with no duplicate root-level copy. Remove `.gitkeep` when the first skill is added.

### Frontmatter and instructions

Follow the [Agent Skills specification](https://agentskills.io/specification): YAML between `---` lines, then substantive Markdown instructions.

| Field | Repository convention |
| --- | --- |
| `name` | Required; 1-64 lowercase ASCII letters/digits with single internal hyphens. Matches its directory. |
| `description` | Required; 1-1024 characters explaining what and when, with specific triggers. |
| `license` | Optional string reflecting actual rights. |
| `compatibility` | Optional; 1-500 characters describing environment requirements. |
| `metadata` | Optional string-to-string map. Quote numbers and booleans. |
| `allowed-tools` | Optional experimental string; grants no permission or service access. |

Unknown fields fail validation. Keep `SKILL.md` under 500 lines where practical; link supporting material inside the plugin for on-demand reading.

Document workflow, outputs, failure handling, tool versions, OS/execution host, authentication, costs, approvals, and permitted side effects. Report missing evidence or prerequisites; do not fabricate success.

Presentation/GIF skills must specify their authoring, export, rendering/encoding tools and asset rights. Canvas skills need a supported visual host and APIs.

## Packaging

`.github/plugin/marketplace.json` points to `./plugins/ve-skills`, relative to the repository root. The plugin's `plugin.json` uses:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "ve-skills"
}
```

Keep the full manifest's metadata. Legacy component-path fields such as `skills`, `agents`, and `mcpServers` are invalid. [Manifest reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#agent-plugins-10-manifest-fields).

Keep one local pack, matching catalog/manifest names, descriptions, and semantic versions. Bump distributed versions when installable content changes; do not assume automatic updates.

Link each `SKILL.md` under **Skill catalog** and update `Implemented skills: N.` in both READMEs. Keep unfinished work under **Roadmap**, without nonexistent links.

## Checks

Node.js 24+ and npm:

```shell
npm ci
npm run validate
npm test
```

`npm run check` combines both checks; CI runs it on pushes and PRs. A YAML parser is the sole development dependency.

Validation checks metadata, local paths, skill structure, and README counts/links. It rejects competing catalogs, overrides, unknown fields, and symlinks/junctions. Zero skills is valid; an actual skill folder needs `SKILL.md`. Fixtures stay outside the shipped pack.

Checks run no models or skill scripts and do not prove client behavior, security, full schema conformance, or web-link validity. Review supporting links and outputs separately.

## Client tests

Record client version, source, scope, and outcome. Test local and GitHub installs separately; report untested app/VS Code flows.

For a temporary Windows CLI mount:

```powershell
copilot --plugin-dir ".\plugins\ve-skills"
```

This starts a model session and may use credits; it does not test installation. Respect trust and permission prompts.

For installation tests, use fresh `COPILOT_HOME` and `COPILOT_CACHE_HOME` directories outside the checkout. Verify identity, version, source, enablement, and plugin-provided skills. Inherited/built-in skills can still appear; this is not a sandbox. Preserve normal settings and delete only owned test directories.

Once a skill exists, test an intended request, paraphrase, unrelated request, and failure case. Judge outputs against the agreed task.

## Safety and licensing

Exclude credentials, private endpoints, customer data, internal templates, and authenticated configuration. Use non-sensitive examples. Skills grant no service access.

Keep [LICENSE](LICENSE) and `plugins/ve-skills/LICENSE` identical. Third-party material needs permitted use/redistribution, source attribution, and required notices; do not copy others' prose or workflows. Follow [GitHub](https://brand.github.com/foundations/logo) and [Microsoft](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks) branding rules without implying endorsement.

Keep PRs small and include dependencies, check results, and testing gaps.
