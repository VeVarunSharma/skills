# Varun’s Skills

Practical agent skills for architecting solutions, building grounded POCs, and telling the technical story.

A personal collection by [Varun](https://github.com/VeVarunSharma), designed for small, focused skills that can be used on their own or together.

**Status: foundation only.** This repository contains the `varun` Copilot plugin marketplace and its `varun-skills` package. No functional skills have shipped yet.

This is an independent collection, not an official GitHub or Microsoft product.

## Skill catalog

**Implemented skills: 0.**

There are no skills to invoke yet. Installing `varun-skills@varun` installs the packaging foundation; it does not add skill commands, tools, or workflows.

## Roadmap

These are planned families, not implemented skills or promised workflows. Each needs a defined scope before authoring.

| Planned family | Status |
| --- | --- |
| Architecture diagrams | Planned |
| Animated architecture diagrams and GIFs | Planned |
| Presentations using permitted GitHub and Microsoft branding | Planned |
| Agentic software factory engineering | Planned |
| Copilot canvas creation | Planned |
| POC launchpad with Next.js, TypeScript, Drizzle ORM, ts-rest, and technical guardrails | Planned |

## Installation

Use a current, supported Copilot client, sign in to an account with Copilot access, and have Git available on the installation host. Organization policies may restrict plugins. Review the source and any trust prompts before installing.

The marketplace is named **`varun`**, not `skills`. The plugin is **`varun-skills`**, so its install identifier is **`varun-skills@varun`**.

Adding a marketplace makes plugins discoverable. Installing and enabling a plugin are separate from running its skills. This foundation uses [Agent Plugins 1.0](https://docs.github.com/en/copilot/reference/plugin-and-marketplace-reference); that format permits a plugin without components.

### Copilot CLI

Run in your terminal:

```shell
copilot plugin marketplace add VeVarunSharma/skills
copilot plugin install varun-skills@varun
```

Inspect the result:

```shell
copilot plugin marketplace browse varun
copilot plugin list
```

Start a fresh session after installation. Expect an enabled `varun-skills` plugin, but **zero skills** in this foundation.

These commands use the repository's default branch. See the official [installation guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing) and [CLI reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference). Use `copilot plugin --help` to check the commands available in your installed version.

### GitHub Copilot app

1. Open **Customize** in the app sidebar.
2. Select the marketplace settings control next to the marketplace dropdown.
3. Follow the prompts to add `VeVarunSharma/skills` or `https://github.com/VeVarunSharma/skills`.
4. Return to **Browse**, find `varun-skills`, review it, and select **Install**.
5. Open **Customize > Installed**, confirm that the plugin is enabled, and start a fresh session.

Use the [official app customization guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app) if your build's controls differ. Plugin installation does not add a canvas or external-service connection to this foundation.

### VS Code

1. Choose the **Copilot** harness for the intended session and ensure `chat.plugins.enabled` is enabled.
2. Open the Command Palette and run **Chat: Manage Plugin Marketplaces**.
3. Select **Add Marketplace...** and enter `VeVarunSharma/skills`.
4. Open **Chat: Open Customizations** / **Customize**, then **Browse**. Select the `varun` marketplace and find `varun-skills`.
5. Review the plugin and marketplace trust prompt, then select **Install**. Confirm that the plugin is enabled for the intended harness and start a fresh session.

If unified **Browse** is unavailable, use **Plugins > Browse Marketplace**. Newer Browse pages also expose **Configure Marketplaces > Add Marketplace** in the source menu.

This repository is a marketplace, not a root-level plugin. For local development with **Chat: Install Plugin from Source**, select the actual `plugins/varun-skills` folder, not the repository root.

See [GitHub's VS Code instructions](https://docs.github.com/en/copilot/how-tos/copilot-in-your-ide/customize-copilot/extend-copilot-with-tools-and-context/using-plugins) and [VS Code's plugin guide](https://code.visualstudio.com/docs/agent-customization/agent-plugins). Feature availability depends on the VS Code version, selected harness, and policy.

## Updates

Do not assume that a marketplace refresh updates installed plugins, or that updates propagate automatically between clients or machines. Review changes before adopting them.

**Copilot CLI:** refresh the catalog, then update the installed package explicitly:

```shell
copilot plugin marketplace update varun
copilot plugin update varun-skills@varun
copilot plugin list
```

Start a fresh session afterward. Third-party marketplace auto-update is an optional setting with runtime-specific limits; this repository does not enable it for you.

**VS Code:** run **Chat: Update Plugins**, or select **Check for and Apply Updates** in the installed plugin group. Automatic updates depend on settings such as `extensions.autoUpdate` and the plugin source. See the [update documentation](https://code.visualstudio.com/docs/agent-customization/agent-plugins#_update-plugins).

**Copilot app:** inspect the package under **Customize > Installed**. The official app guide does not promise an update cadence or a universal update control. The CLI commands above apply to an app-shared local installation only when both use the same host and Copilot installation state. Do not assume they update a remote host or a separate app profile; verify the installed version and start a fresh session.

## Compatibility and prerequisites

The portable package format does not make every future skill or tool portable.

| Area | Boundary |
| --- | --- |
| This foundation | No runtime tools, credentials, MCP servers, hooks, or brand assets are bundled. Node.js/npm are needed only for contributor checks. |
| Presentations (planned) | A future skill must specify its authoring, export, and rendering tools, supported operating systems, and permitted asset sources. No presentation application is assumed or bundled. |
| GIFs (planned) | A renderer and encoder, their installation steps, and platform support must be selected and documented with the actual skill. None is included now. |
| Canvases (planned) | Require a compatible visual host and available canvas/extension tools. CLI installation alone does not supply that UI. App and VS Code harness capabilities must be checked separately; client-specific APIs are not portable Agent Plugins 1.0 components. |
| POC launchpad (planned) | The named application stack is roadmap scope, not a generated app or an installed dependency set. |
| External services | Each service requires its own configuration, authorization, and any applicable billing. A skill or plugin never grants access. |

Remote sessions need their prerequisites on the execution host, not just the local computer. Do not bypass trust, authentication, or organization policy to make a skill run.

## Validation and contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) to propose, author, and validate a skill.

For repository checks, use Node.js 24 or newer and npm:

```shell
npm ci
npm run check
```

The [Validate workflow](https://github.com/VeVarunSharma/skills/actions/workflows/validate.yml) runs the same model-free checks. They cover catalog consistency, the manifest's documented field rules, skill structure, catalog links/counts, and validator regression tests. They intentionally accept the zero-skill foundation.

**Structural validation is not installation testing.** It does not start Copilot, exercise the app or VS Code UI, call a model, or verify skill behavior. A local-directory CLI install is also different from installing the published GitHub source. Record those results separately, including the client version and source tested. App and VS Code instructions are documentation-based, not a claim that their installation flows have been tested for every version.

There can be no functional skill tests until a real skill exists. Do not add empty `SKILL.md` files just to make the catalog look populated.

## License and branding

Original content is licensed under [MIT](LICENSE). That license does not grant rights to GitHub or Microsoft trademarks or third-party assets.

No third-party branding assets are bundled. Only contribute artwork, logos, templates, fonts, or other assets when their terms permit the intended use **and redistribution**; retain required attribution and license notices. Being downloadable is not permission. See the [GitHub brand guidelines](https://brand.github.com/foundations/logo) and [Microsoft trademark and brand guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks).

## References

- [GitHub plugin and marketplace reference](https://docs.github.com/en/copilot/reference/plugin-and-marketplace-reference)
- [Creating and sharing a marketplace](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/create-and-share-plugin-marketplaces)
- [Agent Plugins 1.0 specification](https://github.com/agentplugins/agent-plugins-spec/blob/main/spec/1.0.0.md) and [Agent Skills specification](https://agentskills.io/specification)
- [github/plugin-marketplace-starter](https://github.com/github/plugin-marketplace-starter), for the catalog/plugin layout and model-free validation pattern
- [mattpocock/skills](https://github.com/mattpocock/skills), for clear presentation and the idea of small, composable skills; the content here is original