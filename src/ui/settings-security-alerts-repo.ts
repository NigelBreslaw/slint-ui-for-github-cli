import type { MainWindowInstance } from "../slint-interface.ts";
import {
  readSecurityAlertsRepositoryKv,
  validateSecurityAlertsRepoFullName,
  writeSecurityAlertsRepositoryKv,
} from "../settings/security-alerts-repo-kv.ts";

export function hydrateSecurityAlertsRepo(window: MainWindowInstance): void {
  window.SettingsState.security_alerts_repo_input = readSecurityAlertsRepositoryKv();
  window.SettingsState.security_alerts_repo_error = "";
}

export function applySecurityAlertsRepoEdited(window: MainWindowInstance, text: string): void {
  const v = validateSecurityAlertsRepoFullName(text);
  if (!v.ok) {
    window.SettingsState.security_alerts_repo_error = v.message;
    return;
  }
  window.SettingsState.security_alerts_repo_error = "";
  writeSecurityAlertsRepositoryKv(v.value);
  window.SettingsState.security_alerts_repo_input = v.value;
}

export function clearSecurityAlertsRepoUi(window: MainWindowInstance): void {
  window.SettingsState.security_alerts_repo_input = "";
  window.SettingsState.security_alerts_repo_error = "";
}
