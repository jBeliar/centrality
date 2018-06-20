import React from 'react';
import Mousetrap from 'mousetrap';

import './input.scss'
import { If } from '../utils/utils';


class CentralityInput extends React.Component {

  componentDidMount() {
    this.attachShortcutsListeners()
  }

  componentDidUpdate() {
    if (this.props.loading === false) {
      this.inputRef.focus()
    }
  }

  attachShortcutsListeners() {
    const launcherInput = document.getElementsByClassName('launcher-input')[0]
    Mousetrap(launcherInput).bind('tab',       $event => this.stopEvent($event), 'keydown')
    Mousetrap(launcherInput).bind('shift+tab', $event => this.stopEvent($event), 'keydown')
  }

  stopEvent(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  render() {
    return (
      <div className="input-container">
        <input autoFocus
          
          disabled={this.props.loading}
          ref={ref => this.inputRef = ref}
          onChange={event => this.props.onChangeQuery(event.target.value)}
          className="launcher-input"/>
        <If cond={!!this.props.totalNumber && !this.props.isPreview}>
          <div className="total-number"> {this.props.totalNumber}</div>
        </If>
        <If cond={this.props.pluginName}>
          <div className="context-tab"> {this.props.pluginName} </div>
        </If>
      </div>
    )
  }
}

export default CentralityInput;