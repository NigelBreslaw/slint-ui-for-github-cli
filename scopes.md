# OAuth scopes used by this app

This app calls the GitHub REST API and GitHub CLI with the credentials from **`gh auth login`** on your machine. Those credentials are OAuth tokens with a set of [scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

## Required classic OAuth scopes

| Capability | Scope | Notes |
| ---------- | ----- | ----- |
| `gh api user`, profile / avatar | Default `gh auth login` token | Usually includes `repo` and related defaults. Baseline GitHub CLI auth. |
| `gh api user/orgs` | `read:org` | [List organizations for the authenticated user](https://docs.github.com/en/rest/orgs/members). |
| Projects V2 REST (`…/projectsV2`), `gh project list` | `read:project` | Read access to projects. |

We do **not** require the `project` (write) scope unless the app later adds mutating project APIs.

### Add scopes with the CLI

The in-app **Login** button runs (scopes match `REQUIRED_GH_OAUTH_SCOPES` in code—`read:org` and `read:project` today):

```bash
gh auth login --web --git-protocol ssh --skip-ssh-key --scopes read:org,read:project
```

That opens the browser quickly and avoids repeated HTTPS/SSH and SSH key prompts. **Tradeoff:** Git operations for GitHub are configured for **SSH** by this flow; if you prefer HTTPS for `git`, run `gh config set git_protocol https -h github.com` afterward or authenticate with different flags.

```bash
gh auth refresh --scopes read:org,read:project
```

See [gh auth login](https://cli.github.com/manual/gh_auth_login) and [gh auth refresh](https://cli.github.com/manual/gh_auth_refresh).

### Fine-grained personal access tokens

If you authenticate `gh` with a **fine-grained** personal access token, `gh auth status` may not list classic OAuth scopes the same way. The app may show that scopes could not be verified; use **Add missing scopes** in the UI (or the command above) if features fail with `403`.

## Testing scopes locally

To manually test the “missing scope” UI without a second account:

1. **Remove** `read:project` (not part of GitHub CLI’s minimum token set):

   ```bash
   gh auth refresh --remove-scopes read:project
   ```

2. Start the app; you should see the prompt to add missing scopes.

3. **Restore** when done:

   ```bash
   gh auth refresh --scopes read:project
   ```

   Or use **Add missing scopes** in the app.

**Note:** `repo`, `read:org`, and `gist` are CLI **minimum** scopes and cannot be removed with `--remove-scopes`. Testing a missing `read:org` case usually requires unit tests with fixture JSON or a specially scoped token, not `gh` alone.
