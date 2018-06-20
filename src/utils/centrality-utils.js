import { join } from 'path';
import { remote } from 'electron';
import { loadJsonAsync } from './file-utils';

const settingsFileName = 'settings.json'
const settingsPluginFileName = 'plugin-config.json'

const centralityUserSettingsPath = join(remote.app.getPath('userData'), 'settings')

export const loadPluginSettings = () => {
  const pluginConfigPath = join(centralityUserSettingsPath, settingsPluginFileName)
  return loadJsonAsync(pluginConfigPath)
}

export const loadSettings = () => {
  const settingsPath = join(centralityUserSettingsPath, settingsFileName)
  return loadJsonAsync(settingsPath)
}