import React from 'react';

import './item.scss'
import { If } from '../utils/utils';


class CentralityListItem extends React.Component {

  getListItemClasses() {
    let classess = 'list-item'
    if (this.props.selected) {
      classess += ' selected'
    }
    if (this.props.tailSelected) {
      classess += ' selected-in-area'
    }
    if (!this.props.item.path) {
      classess += ' list-item--small'
    }
    return classess
  }

  render() {
    return (
      <div
        className={this.getListItemClasses()}
      >
      <img src={this.props.item.icon}/>
      <div className="list-item__info">
        <div className="list-item__name" dangerouslySetInnerHTML={{__html: this.props.item.viewValue||this.props.item.value}}></div>
        <div className="list-item__path">{this.props.item.path}</div>
      </div>
      <If cond={this.props.item.addition}>
        <div className="list-item__addition" dangerouslySetInnerHTML={{__html: this.props.item.addition}}></div>
      </If>
    </div>
    )
  }
}

export default CentralityListItem;