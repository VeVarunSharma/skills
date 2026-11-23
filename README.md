# Ve Skills

Practical agent skills for architecting solutions, building grounded POCs, and telling the technical story.

A personal [Agent Plugins 1.0](https://docs.github.com/en/copilot/reference/plugin-and-marketplace-reference) pack. This is an independent collection, not an official GitHub or Microsoft product.

## Skill catalog

**Implemented skills: 0.**

The package currently adds no skills, commands, tools, or workflows.

## Roadmap

Planned:

- Architecture diagrams
- Animated architecture diagrams and GIFs
- Presentations using permitted GitHub and Microsoft branding
- Agentic software factory engineering
- Copilot canvas creation
- POC launchpad with Next.js, TypeScript, Drizzle ORM, ts-rest, and technical guardrails

## Installation

Use a supported Copilot client, an account with Copilot access, and Git on the installation host. Review the source and trust prompts; organization policies apply. Start a fresh session after installing or updating.

### Copilot CLI

```shell
copilot plugin marketplace add VeVarunSharma/skills
copilot plugin install ve-skills@ve
```

Check discovery and installation:

```shell
copilot plugin marketplace browse ve
copilot plugin list
```

These commands use the default branch. See the [CLI guide](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-finding-installing) or `copilot plugin --help`.

### GitHub Copilot app

In **Customize**, open marketplace settings beside the marketplace dropdown and add `VeVarunSharma/skills`. In **Browse**, find `ve-skills` and select **Install**. Confirm enablement under **Installed**. [App guide](https://docs.github.com/en/copilot/how-tos/github-copilot-app/customize-github-copilot-app).

### VS Code

Select the **Copilot** harness and enable `chat.plugins.enabled`. Run **Chat: Manage Plugin Marketplaces > Add Marketplace...** and enter `VeVarunSharma/skills`. Open **Chat: Open Customizations > Browse**, then install `ve-skills`.

If Browse is unavailable, use **Plugins > Browse Marketplace**. Local source installs must select `plugins/ve-skills`, not the repository root. [VS Code guide](https://code.visualstudio.com/docs/agent-customization/agent-plugins).

## Updates

Review changes, refresh the catalog, then update the installed package:

```shell
copilot plugin marketplace update ve
copilot plugin update ve-skills@ve
copilot plugin list
```

In VS Code, use **Chat: Update Plugins** or **Check for and Apply Updates**.

Automatic updates depend on the client, settings, and source; this marketplace enables none. App documentation specifies no guaranteed cadence or universal update control. CLI updates affect an app-shared installation only on the same host and profile. Manage the plugin under **Customize > Installed**.

### Moving from the old name

Names do not migrate automatically. If you installed the old pack, remove it first, then follow [Installation](#installation):

```shell
copilot plugin uninstall varun-skills@varun
copilot plugin marketplace remove varun
```

## Compatibility

No runtime tools, credentials, MCP servers, hooks, or brand assets are bundled. Future presentation/GIF skills must specify their authoring, export, rendering, encoding, OS, and licensing requirements.

Canvases need a compatible visual host and its tools; client-specific APIs are not portable. CLI installation alone supplies no canvas UI. Put prerequisites on the execution host. External services require separate configuration, authorization, and any applicable billing.

## Contributing and checks

See [CONTRIBUTING.md](CONTRIBUTING.md). Maintainer checks require Node.js 24+:

```shell
npm ci
npm run check
```

The [CI workflow](https://github.com/VeVarunSharma/skills/actions/workflows/validate.yml) runs structural checks and regression tests without model calls. Client installation and skill behavior require separate tests. App/VS Code instructions are documentation-based; those installation flows remain untested.

## License and branding

Original work uses [MIT](LICENSE). Trademarks and third-party assets retain their own rights. Redistribution must be permitted and attributed. Follow [GitHub](https://brand.github.com/foundations/logo) and [Microsoft](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks) brand guidelines.

## References

[Marketplace starter](https://github.com/github/plugin-marketplace-starter) for layout; [mattpocock/skills](https://github.com/mattpocock/skills) for presentation inspiration. Content here is original.