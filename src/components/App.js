import React from 'react';

import '../assets/css/App.css';

import pluginService from '../services/pluginService'
import Launcher from './launcher/launcher.c'
import Loader from './loader/loader.c'
import { loadSettings } from '../utils/centrality-utils';
import { setGlobalShortcut } from '../utils/electron-utils';

class App extends React.Component {
  constructor() {
    super()
    this.state = {
      isPluginsLoaded: false
    }
  }

  async componentDidMount() {
    const settings = await loadSettings()
    setGlobalShortcut(settings.shortcut)
    await pluginService.init(settings.pluginsPath)
    this.setState({
      isPluginsLoaded: true,
      pageLimit: settings.pageLimit
    })
  }

  render() {
    return this.state.isPluginsLoaded ?
      <Launcher pageLimit={this.state.pageLimit}/> :
      <Loader/>;
  }
}

export default App;
