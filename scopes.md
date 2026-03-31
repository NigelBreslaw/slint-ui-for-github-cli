# OAuth scopes used by this app

This app calls the GitHub REST API and GitHub CLI with the credentials from **`gh auth login`** on your machine. Those credentials are OAuth tokens with a set of [scopes](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps).

The app requires **GitHub CLI 2.89.0 or newer** (see [`MIN_GH_CLI_VERSION`](app/src/gh/gh-cli-version.ts)); older versions are blocked at startup before scope checks.

## Required classic OAuth scopes

| Capability | Scope | Notes |
| ---------- | ----- | ----- |
| GraphQL `viewer` (profile / avatar / status), `gh api graphql` | Default `gh auth login` token | Same baseline token as REST; no extra scope vs typical `gh` sign-in. |
| `gh api user/orgs` | `read:org` | [List organizations for the authenticated user](https://docs.github.com/en/rest/orgs/members). |
| GraphQL `projectsV2` (org/user) | `read:project` | Read access to projects. |
| REST `GET /notifications` (e.g. debug dump `notifications--threads.json` when `GH_DEBUG_JSON=1`) | `notifications` | [List notifications](https://docs.github.com/en/rest/activity/notifications#list-notifications-for-the-authenticated-user). Scope checks also accept **`repo`**, which GitHub documents as sufficient for this API. |
| REST `GET /repos/{owner}/{repo}/dependabot/alerts` (Dashboard **Security alerts** tab) | **`repo`** or **`security_events`** | [List Dependabot alerts for a repository](https://docs.github.com/en/rest/dependabot/alerts#list-dependabot-alerts-for-a-repository). Not part of the app’s **required** login scopes: the tab shows an error if the token cannot access alerts. Many `gh` installs already have **`repo`** as a baseline scope. |

We do **not** require the `project` (write) scope unless the app later adds mutating project APIs.

To widen the token for Dependabot only, you can run:

```bash
gh auth refresh --scopes read:org,read:project,notifications,security_events
```

(or include `repo` instead of `security_events` if you prefer GitHub’s broader classic scope).

### Authorize with the CLI

The app only treats you as signed in when `gh` is authenticated **and** the token has the required scopes. Otherwise it shows the same **logged out** state with an explanation; use **Login** in the app (or run the command below) to authorize with the right scopes.

The in-app **Login** flow runs (scopes match `REQUIRED_GH_OAUTH_SCOPES` in code—`read:org`, `read:project`, and `notifications` today):

```bash
gh auth login --web --git-protocol ssh --skip-ssh-key --scopes read:org,read:project,notifications
```

That opens the browser quickly and avoids repeated HTTPS/SSH and SSH key prompts. **Tradeoff:** Git operations for GitHub are configured for **SSH** by this flow; if you prefer HTTPS for `git`, run `gh config set git_protocol https -h github.com` afterward or authenticate with different flags.

When `gh` falls back to the **device code** flow, the app overlay shows the one-time code and a button to copy the code and open the device page; full `gh` output is still printed in the terminal (you may need to press Enter there when prompted).

You can also add scopes without a full login:

```bash
gh auth refresh --scopes read:org,read:project,notifications
```

See [gh auth login](https://cli.github.com/manual/gh_auth_login) and [gh auth refresh](https://cli.github.com/manual/gh_auth_refresh).

### Fine-grained personal access tokens

If you authenticate `gh` with a **fine-grained** personal access token, `gh auth status` may not list classic OAuth scopes the same way. The app will show **logged out** with a message that scopes could not be verified; use **Login** in the app (or `gh auth refresh` / re-login) if features fail with `403`.

## Testing scopes locally

To manually test the “missing scope” behavior without a second account:

1. **Remove** `read:project` (not part of GitHub CLI’s minimum token set):

   ```bash
   gh auth refresh --remove-scopes read:project
   ```

2. Start the app; you should see **logged out** with a message about missing scopes and **Login**.

3. **Restore** when done:

   ```bash
   gh auth refresh --scopes read:org,read:project,notifications
   ```

   Or use **Login** in the app.

**Note:** `repo`, `read:org`, and `gist` are CLI **minimum** scopes and cannot be removed with `--remove-scopes`. Testing a missing `read:org` case usually requires unit tests with fixture JSON or a specially scoped token, not `gh` alone.
