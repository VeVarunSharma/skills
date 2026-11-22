# Contributing

Keep skills focused, composable, grounded in the user's actual context, and honest about their limits. This is an independent personal collection, not an official GitHub or Microsoft product.

## Propose scope before adding a skill

The families in the [roadmap](README.md#roadmap) are ideas, not approved workflows. First agree on a concrete task, intended users, expected output, supported Copilot surfaces, and what the skill should not do.

Do not add empty directories or placeholder `SKILL.md` files for roadmap items. The initial plugin deliberately has zero skills; that is valid packaging, not missing test coverage to fill with a dummy skill.

## Author in the plugin

Add an actual skill at:

```text
plugins/
  varun-skills/
    skills/
      your-skill-name/
        SKILL.md
        references/  (only if needed)
        scripts/     (only if needed)
        assets/      (only if needed and redistributable)
```

Do not duplicate it in a root-level skills directory. Agent Plugins discovers immediate child folders of the plugin's `skills` directory, not arbitrarily nested skills. `.gitkeep` only preserves the otherwise empty directory and can be removed when the first skill is added.

### Frontmatter and instructions

Follow the [Agent Skills specification](https://agentskills.io/specification). Use YAML frontmatter delimited by `---` on separate lines, followed by meaningful Markdown instructions.

| Field | Repository convention |
| --- | --- |
| `name` | Required; 1-64 lowercase ASCII letters, digits, and single hyphens. No leading, trailing, or repeated hyphens. Must match the containing directory. |
| `description` | Required; 1-1024 characters. Say what the skill does and when to use it, with specific triggers rather than claiming every task. |
| `license` | Optional string; do not mislabel third-party material as MIT. |
| `compatibility` | Optional; 1-500 characters naming important client, OS, runtime, or network requirements. |
| `metadata` | Optional map of string keys to string values. Quote values that YAML might otherwise read as numbers or booleans. |
| `allowed-tools` | Optional, experimental string. Tool declarations do not authorize execution or grant service access. |

Use portable fields above; unknown fields fail this repository's checks. Keep `SKILL.md` under 500 lines where practical. Put substantial supporting material in references, scripts, or assets and link it from the skill instead of loading everything up front. Use portable relative links and keep packaged references inside the plugin.

Explain prerequisites, the intended workflow, expected outputs, and common failure cases. Stop or report a blocker when evidence, a required tool, or permission is missing. Do not invent data or disguise failures as successful outputs.

For each real skill, document:

- Which Copilot app, CLI, and VS Code harnesses were tested, and which are unsupported or untested.
- Required tools and versions, OS-specific setup, and whether they run locally or on a remote host.
- Any connectors/MCP servers, separate authentication, permissions, costs, and user approvals.
- The permitted scope of file changes, commands, deployment, and other side effects.
- How to inspect the result and recognize a failed or incomplete run.

Presentation skills must name their actual authoring/export/rendering tools and asset rights. GIF skills must name their renderer/encoder and setup. Canvas skills must use a supported host's APIs rather than assuming a visual host exists in the CLI. Do not choose these tools for an unspecified roadmap item.

## Keep packaging and documentation consistent

The marketplace catalog is `.github/plugin/marketplace.json`. Its source `./plugins/varun-skills` is relative to the **repository root**, even though the catalog is nested.

The portable manifest is `plugins/varun-skills/plugin.json`, using:

```json
{
  "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
  "name": "varun-skills"
}
```

That is the format's minimal example, not a replacement for this repository's full manifest. Keep its version, description, repository, author, and MIT metadata. Do not add legacy top-level component paths such as `skills`, `agents`, or `mcpServers`. See the [manifest reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference#agent-plugins-10-manifest-fields).

This marketplace intentionally contains one local pack. Its validator checks this profile, not every possible marketplace source type. It rejects competing catalogs, catalog component overrides, unknown catalog fields, unsafe paths, and symbolic links/junctions in the plugin.

When adding a real skill, add one direct link to its `SKILL.md` under **Skill catalog** in the main README. Update the `Implemented skills: N.` count in both READMEs, replace the foundation-only wording as appropriate, and keep unfinished families separately labeled under **Roadmap**. Do not link planned skills to nonexistent files.

Synchronize plugin names, descriptions, and versions between the catalog and manifest. Use semantic versions; after a version has been distributed, bump the version for changed installable content or behavior. Keep `0.1.0` while preparing the initial undistributed foundation. Explain meaningful changes in the contribution, and do not assume every user's client updates automatically.

## Run structural checks

Use Node.js 24+ and npm:

```shell
npm ci
npm run validate
npm test
```

`npm run check` combines validation and tests. CI runs it on pushes and pull requests. The only development dependency is a YAML parser; there are no installed-plugin runtime dependencies.

Checks cover strict JSON/YAML parsing, supported manifest field rules, catalog consistency, local source containment, skill frontmatter/body structure, and README skill counts/links. Focused tests use temporary synthetic skills outside the shipped pack. An intentionally empty pack passes; an actual skill folder missing `SKILL.md` does not.

These are repository structural checks, **not** a general-purpose JSON Schema engine, complete Agent Plugins client-conformance suite, security audit, link checker for the web, or proof that a skill works. Review supporting resource links, script behavior, and generated outputs separately. The validator never executes skill scripts or calls a model.

## Test in real clients separately

Record the client version, source commit or local path, test scope, and result. Use a fresh session and verify the selected plugin/source, not a previously installed copy.

For a temporary local CLI mount from the repository root on Windows:

```powershell
copilot --plugin-dir ".\plugins\varun-skills"
```

This starts a Copilot session and can use AI credits. It does **not** install the plugin or prove that the GitHub-hosted marketplace installs. Review trust and permission prompts; do not add unattended approval flags.

For a true installation test, use a newly created disposable profile and cache through the documented `COPILOT_HOME` and `COPILOT_CACHE_HOME` settings, from outside this checkout. First register the checkout path and install `varun-skills@varun`; separately test the exact published-source commands in the [README](README.md#copilot-cli) using a fresh profile/cache after publication.

Inspect marketplace, plugin, and skill inventories. Verify name, version, enablement, source, and expected plugin-provided skill count. A disposable Copilot home separates installation state; it is not a sandbox, and built-in or inherited skills may still appear. Preserve the normal profile and clean up only the disposable directories you created. Installation/list/update commands do not require a model session, but host approval and authentication rules still apply.

In the app and VS Code, use the README's native marketplace flows and verify the plugin in the intended host/harness. Do not label a CLI test as a GUI installation test. If a client cannot be exercised, report it as untested with the relevant limitation.

Once a real skill exists, test an intended task, a paraphrased trigger, an unrelated task that should not activate it, and a missing-prerequisite/failure case. Judge the output against the agreed task, not just whether the skill appeared in a list. Until then, only packaging can be tested.

## Credentials, licenses, and branding

Never contribute tokens, passwords, private endpoints, real customer data, internal templates, or local authenticated configuration. Use non-sensitive illustrative inputs. A plugin or skill does not grant rights to services, data, paid tools, or restricted APIs.

Original contributions use the repository's [MIT license](LICENSE). Keep its copy at `plugins/varun-skills/LICENSE` identical so the notice travels with the installed package. Third-party content retains its own rights and terms. Before including an asset, verify that its license permits redistribution and the intended use; record its source and include required notices alongside it. If permission is unclear, do not bundle it. Do not copy another skill collection's prose or workflows.

GitHub/Microsoft logos, fonts, icons, and templates are not automatically MIT-licensed because a repository is. Prefer links to permitted sources over bundling assets. Follow the [GitHub](https://brand.github.com/foundations/logo) and [Microsoft](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks) brand guidelines, and never imply endorsement.

## Submit a contribution

Keep the change small, explain its scope and dependencies, include the structural check results, and distinguish actual client/behavior tests from untested surfaces. Contributions may use pull requests; that does not authorize tooling to open one or publish a release on a user's behalf.
