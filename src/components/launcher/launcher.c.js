import React from 'react';
import Mousetrap from 'mousetrap';

import './launcher.c.scss'

import searchService from '../../services/searchService';
import { If, For } from '../utils/utils';
import CentralityInput from '../input/Input';
import CentralityListItem from '../item/Item';
import {
  openDevTools,
  setInitPosition,
  setFullScreenPosition,
  setNewHeight,
  hideWindow
} from '../../utils/electron-utils';

class Launcher extends React.Component {

  constructor() {
    super()
    this.state = {
      loading: true,
      pluginName: '',
      totalNumber: 0,
      preview: '',
      list: [],
      selected: 0,
      selectedTail: [],
      inputValue: '',
      listLoading: false
    }
    this.lastBodyHeight = 0
    this.isFullscreen = false

    this.initPlugins = this.initPlugins.bind(this)
  }

  componentDidMount() {
    this.prepareWindowHeight()
    this.initPlugins()
    this.attachShortcutsListeners()
  }

  openDevTools($event) {
    this.stopEvent($event)
    openDevTools()
  }

  initPlugins() {
    this.asyncLoading(
      searchService.initPlugins(), async() => {
        await this.onChangeQuery()
        setInitPosition()
      }
    )
  }

  toggleFullscreen() {
    if (this.isFullscreen) {
      setInitPosition()
    } else {
      setFullScreenPosition()
    }
    this.isFullscreen = !this.isFullscreen
  }

  async onChangeQuery(query = '') {
    const context = searchService.getContext(query)
    const oldContextName = this.state.pluginName
    this.cContext = context
    
    this.setState({pluginName: context.name, inputValue: query, listLoading: true})
    await this.setList()

    if (this.state.totalNumber > 0 || oldContextName !== this.cContext.name) {
      this.setState({preview: ''})
    }
    this.prepareWindowHeight()
  }

  getSlicedList(list, pageLimit) {
    return pageLimit === '*' ? list : list.slice(0, pageLimit)
  }

  async setList(items) {
    const list = items || await this.cContext.getList()
    if (this.state.listLoading || items) {
      this.setState({
        totalNumber: list.length,
        list: this.getSlicedList(list, this.props.pageLimit),
        selected: 0,
        selectedTail: [],
        listLoading: false
      })
    }
  }

  async setPreview() {
    const item = this.state.list[this.state.selected]
    this.setState({
      preview: await this.cContext.preview(item, query => this.onChangeQuery(query))
    })
    this.prepareWindowHeight()
  }

  prepareWindowHeight() {
    setTimeout(() => {
      const clientHeight = document.getElementById('root').clientHeight
      if (clientHeight !== this.lastBodyHeight) {
        this.lastBodyHeight = clientHeight
        setNewHeight(clientHeight)
      }
    })
  }
  
  selectNext(e) {
    let newState = {selectedTail: []}
    this.stopEvent(e)
    if(this.state.selected + 1 < this.state.list.length) {
      newState = {...newState, selected: this.state.selected + 1}
    }
    this.setState(newState)
  }
  
  selectPrevious(e) {
    let newState = {selectedTail: []}
    this.stopEvent(e)
    if(this.state.selected > 0) {
      newState = {...newState, selected: this.state.selected - 1}
    }
    this.setState(newState)
  }

  selectNextInGroup(e) {
    this.stopEvent(e)
    if(this.state.selected + 1 < this.state.list.length) {
      this.setState({selected: this.state.selected + 1})
    }
    if (this.state.selectedTail.length > 0) {
      if (this.state.selectedTail[0] < this.state.selected) {
        this.setState({selectedTail: [...this.state.selectedTail, this.state.selected - 1] })
      } else {
        this.setState({selectedTail: this.state.selectedTail.filter( s => s !== this.state.selected) })
      }
    } else {
      this.setState({selectedTail: [...this.state.selectedTail, this.state.selected - 1] })
    }
  }

  selectPreviousInGroup(e) {
    this.stopEvent(e)
    if(this.state.selected > 0) {
      this.setState({selected: this.state.selected - 1})
    }
    if (this.state.selectedTail.length > 0) {
      if (this.state.selectedTail[0] > this.state.selected) {
        this.setState({selectedTail: [...this.state.selectedTail, this.state.selected + 1] })
      } else {
        this.setState({selectedTail: this.state.selectedTail.filter( s => s !== this.state.selected) })
      }
    } else {
      this.setState({selectedTail: [...this.state.selectedTail, this.state.selected + 1] })
    }
  }

  closeAction() {
    this.cContext.onClose(
      this.state.list[this.state.selected],
      list => this.setList(list)
    )
  }
  
  onEnter() {
    this.asyncLoading(
      this.setPreview()
    )
    const item = this.state.list[this.state.selected]
    const tailItems = this.state.selectedTail.map(id => this.state.list[id])
    const items = [item, ...tailItems]

    this.state.selectedTail.forEach(rowId => 
      this.onEnterAction(this.state.list[rowId])
    )
    
    this.asyncLoading(
      Promise.all(
        items.map(i => this.onEnterAction(item))
      )
    )
  }

  onEsc() {
    if (this.inputRef === document.activeElement) {
      hideWindow()
    } else {
      this.inputRef.focus()
    }
  }

  setInputValue(value) {
    this.setState({inputValue: value})
  }

  onEnterAction(item) {
    return this.cContext.onEnter(item, query => this.setInputValue(query), () => hideWindow())
  }

  asyncLoading(maybyPromise, thenCallback) {
    if (maybyPromise && maybyPromise.then) {
      this.setState({loading: true})
      return maybyPromise.then( async value => {
        thenCallback && (await thenCallback())
        this.setState({loading: false})
        return value
      }).catch( err => {
        console.error(err)
        this.setState({
          loading: false,
          preview: err.toString()
        })
      })
    }
    return maybyPromise
  }

  stopEvent(e) {
    e.stopPropagation()
    e.preventDefault()
  }

  attachShortcutsListeners() {
    const launcherContainer = document.getElementsByClassName('launcher-container')[0]
    Mousetrap(launcherContainer).bind('down',      $event => this.selectNext($event))
    Mousetrap(launcherContainer).bind('up',        $event => this.selectPrevious($event))
    Mousetrap(launcherContainer).bind('shfit+J',   $event => this.selectNext($event))
    Mousetrap(launcherContainer).bind('shfit+T',   $event => this.openDevTools($event))
    Mousetrap(launcherContainer).bind('shfit+K',   $event => this.selectPrevious($event))
    Mousetrap(launcherContainer).bind('enter',     $event => this.onEnter(),                    'keydown')
    Mousetrap(launcherContainer).bind('ctrl+w',    $event => this.closeAction(),                'keydown')
    Mousetrap(launcherContainer).bind('f11',       $event => this.toggleFullscreen(),           'keydown')
    Mousetrap(launcherContainer).bind('shift+j',   $event => this.selectNextInGroup($event))
    Mousetrap(launcherContainer).bind('shift+k',   $event => this.selectPreviousInGroup($event))

    document.addEventListener( 'keyup', event => {
      if (event.key === "Escape") {
        this.onEsc()
      }
    }, false)
  }

  render() {
    return (
    <div className={"launcher-container" + ((this.state.loading||this.state.listLoading)?' loader-background':'')}>

      <CentralityInput
        onChangeQuery={query => this.onChangeQuery(query)}
        loading={this.state.loading}
        totalNumber={this.state.totalNumber}
        pluginName={this.state.pluginName}
        isPreview={!!this.state.preview}
        inputValue={this.state.inputValue}
        ref={ref => this.inputRef = ref&&ref.inputRef}
      />
      <div className="result-container">
        <If cond={!this.state.preview}>
          <div className="list-container">
            <For list={this.state.list} fn={(item, i) => (
              <CentralityListItem
                key={i}
                item={item}
                selected={i === this.state.selected}
                tailSelected={this.state.selectedTail.includes(i)}/>
            )}/>
          </div>
        </If>
        <If cond={this.state.preview}>
          <div className="preview-container"
            dangerouslySetInnerHTML={{__html: this.state.preview}}
          ></div>
        </If>
      </div>
    </div>
    );
  }
}

export default Launcher;