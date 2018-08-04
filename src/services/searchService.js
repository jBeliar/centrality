import {
  removeSpaces,
  ensurePluginContextFormat,
  splitQuery,
  ensurePluginFormat
} from '../utils/plugin-utils';
import PluginProvider from './pluginService';
import { reload } from '../utils/electron-utils';

module.exports = {
  plugins: [],
  DEFAULT_PLUGIN: '',

  initPlugins() {
    this.plugins = PluginProvider.provider()
    this.DEFAULT_PLUGIN = this.getPlugin('__file__')

    return Promise.all(
      this.plugins
        .filter(plugin => plugin.init)
        .map(plugin => plugin.init())
    )
  },

  getContext(query) {
    const trimmedQuery = removeSpaces(query)
    const exceptionContext = this.checkInternalCommands(trimmedQuery)
    if (exceptionContext) {
      return ensurePluginContextFormat(exceptionContext)
    }

    let [ pluginKeyword, contextQuery ] = splitQuery(trimmedQuery)
    let plugin = this.getPlugin(pluginKeyword)
    if (!plugin) {
      plugin = this.DEFAULT_PLUGIN
      contextQuery = trimmedQuery
    }
    return this.pluginToContext(ensurePluginFormat(plugin), contextQuery)
  },

  pluginToContext(plugin, query) {
    return {
      name: plugin.name,
      preview: (item, setInput) => plugin.preview(query, item, setInput),
      getList: () => plugin.queryResults(query),
      onEnter: (item, setInput) => plugin.onEnter(query, item, setInput),
      onClose: (item, setList) => plugin.onClose(query, item, setList),
      config: plugin.config
    }
  },

  checkInternalCommands(query) {
    switch (query) {
      case 'reinit':
      case 'ri':
        return {
          name: 'Reinit plugins',
          onEnter: async (_, setInput) => { setInput(''); return this.initPlugins() }
        }
      case 'rl':
        return {
          name: 'Reload app',
          onEnter: async (_, setInput) => reload()
        }
      case '?':
        return {
          getList: () => this.plugins.map(plugin => ({
            value: `${plugin.name} (${plugin.keyword})`,
            keyword: plugin.keyword
          })),
          onEnter: (item, setQuery) => setQuery(item.keyword + ' '),
          name: 'Plugins'
        }
    }
  },

  getPlugin(keyword) {
    return this.plugins.find(plugin => plugin.keyword === keyword)
  }
}
