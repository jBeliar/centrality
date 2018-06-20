import { join } from 'path'

import { getFilesNames } from '../utils/file-utils';
import { PluginToolsApi } from '../plugins/PluginToolsApi';
import { loadPluginSettings } from '../utils/centrality-utils';

const pluginFile = require('../plugins/built-in-plugins/plugin-file')
const pluginMath = require('../plugins/built-in-plugins/plugin-math')

let plugins = []

module.exports = {

  async init(pluginsPath) {
    const builtInPlugins = [pluginFile, pluginMath]
      .map(plugin => plugin.plugin(PluginToolsApi))

    const config = await loadPluginSettings()
    const externalPluginsNames = await getFilesNames(pluginsPath)
      .then(names => names.filter(name => name.startsWith('plugin-')))

    const externalPlugins = externalPluginsNames
      .map(name => this.requireModule(join(pluginsPath, name)))
      .map(c_module => this.buildModule(c_module, config[c_module.id ? `plugin-${c_module.id}` : '']))
      .filter(maybyModule => maybyModule !== undefined)
    plugins = [...builtInPlugins, ...externalPlugins]
    return plugins
  },
  
  provider() {
    return plugins
  },
  
  buildModule(p, config) {
    let m;
    try {
        m = p.plugin(PluginToolsApi, config)
    } catch (e) {
        console.log(e.message)
    }
    return m;
  },
  
  requireModule(path) {
    return eval(`require("${path.replace(/\\/g, '\\\\')}")`)
  }
}
