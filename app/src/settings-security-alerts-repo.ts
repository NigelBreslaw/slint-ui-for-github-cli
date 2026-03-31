import { assignProperties } from "slint-bridge-kit";
import type { MainWindowInstance } from "./slint-interface.ts";
import {
  readSecurityAlertsRepositoryKv,
  validateSecurityAlertsRepoFullName,
  writeSecurityAlertsRepositoryKv,
} from "./backend/settings/security-alerts-repo-kv.ts";
import { onSecurityAlertsRepositorySaved } from "./slint-window-bridge.ts";

export function hydrateSecurityAlertsRepo(window: MainWindowInstance): void {
  assignProperties(window.SettingsState, {
    security_alerts_repo_input: readSecurityAlertsRepositoryKv(),
    security_alerts_repo_error: "",
  });
}

export function applySecurityAlertsRepoEdited(window: MainWindowInstance, text: string): void {
  const v = validateSecurityAlertsRepoFullName(text);
  if (!v.ok) {
    window.SettingsState.security_alerts_repo_error = v.message;
    return;
  }
  writeSecurityAlertsRepositoryKv(v.value);
  assignProperties(window.SettingsState, {
    security_alerts_repo_error: "",
    security_alerts_repo_input: v.value,
  });
  onSecurityAlertsRepositorySaved(window);
}

export function clearSecurityAlertsRepoUi(window: MainWindowInstance): void {
  assignProperties(window.SettingsState, {
    security_alerts_repo_input: "",
    security_alerts_repo_error: "",
  });
}
