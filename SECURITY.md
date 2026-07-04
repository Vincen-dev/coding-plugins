# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Coding Plugins, please report it privately through GitHub Security Advisories:

```text
https://github.com/Vincen-dev/coding-plugins/security/advisories/new
```

If private advisories are unavailable, contact the maintainer listed in the plugin manifests:

```text
Vincen <hx001007@gmail.com>
```

Do not open a public issue for security vulnerabilities.

## What to Include

Please include:

- A clear description of the vulnerability.
- Steps to reproduce.
- Affected version or commit SHA.
- Platform and client, such as Codex, Claude Code, Gemini CLI, Copilot CLI, OpenCode, Trae, Qoder, Cursor, or another local skills client.
- Impact assessment, including whether arbitrary command execution, secret exposure, prompt injection, unsafe file writes, or workflow bypass is possible.
- Any mitigation or workaround you have already identified.

## Response Timeline

- Acknowledgment: within 72 hours when possible.
- Initial status update: within 5 business days.
- Fix target: confirmed vulnerabilities are prioritized for the next patch release; high-impact issues should be patched before unrelated feature work.

This project is maintained as a local plugin. Response times may vary, but security reports take priority over normal issues.

## Supported Versions

| Version | Supported |
| --- | --- |
| Latest release and current `main` branch | Yes |
| Older releases | No |

This project does not provide long-term support for older releases. Users should upgrade to the latest release before reporting issues against stale versions.

## Security Scope

Coding Plugins runs locally and gives AI agents workflow instructions. Important security boundaries include:

- **SessionStart hooks:** Codex hook scripts run with the user's shell privileges. Changes under `hooks/` must be reviewed carefully.
- **Skill instructions:** files under `skills/` can influence agent behavior. Malicious or overly broad instructions can cause unsafe command usage or data exposure.
- **Local scripts:** files under `scripts/` read and write local repository files. They must avoid destructive defaults and must not exfiltrate data.
- **Git workflow:** `git-commit` intentionally checks author identity and sensitive files before committing. Bypassing those checks can leak secrets.
- **Subagent prompts:** generated prompts must avoid leaking unrelated project context, stale plan content, secrets, or unrelated user conversation.
- **Platform manifests:** `.codex-plugin/`, `.claude-plugin/`, root `plugin.json`, `gemini-extension.json`, `.agents/skills`, and related install metadata must point only to intended local resources.

## Out of Scope

The following are usually out of scope unless they create a concrete vulnerability in this repository:

- Reports against third-party AI clients or model behavior without a Coding Plugins-specific exploit path.
- Social engineering against maintainers.
- Denial-of-service through extremely large local repositories unless it bypasses a security control.
- Issues caused by users manually editing generated files to unsafe content.

## Handling Secrets

Do not include real credentials, tokens, private keys, production data, or private repository content in vulnerability reports.

If a secret was accidentally committed:

1. Revoke or rotate the secret immediately.
2. Remove it from active branches.
3. Treat Git history cleanup as secondary to revocation.
4. Report the plugin behavior only if Coding Plugins contributed to the exposure.

## Maintainer Checklist

Before publishing or merging security-sensitive changes, run:

```bash
npm run preflight
bash tests/hooks/test-session-start.sh
git diff --check
```

For manifest or platform-support changes, also confirm:

- `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, root `plugin.json`, and `gemini-extension.json` use the same version.
- `.agents/skills` resolves to the intended `skills/` directory.
- Hook scripts do not execute unexpected commands.
- Documentation does not ask users to paste secrets into prompts or generated reports.
