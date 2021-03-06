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
      listLoading: false,
      isFullscreen: false
    }
    this.lastBodyHeight = 0
    this.selectedLinkIndex = -1
    this.delay = 500
    this.asyncTimer = null
    this.oldContextName = ''

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
    if (this.state.isFullscreen) {
      setInitPosition()
    } else {
      setFullScreenPosition()
    }
    this.setState({isFullscreen: !this.state.isFullscreen}, () => {
      this.prepareWindowHeight()
    })
  }

  async onChangeQuery(query = '') {
    clearTimeout(this.asyncTimer)
    this.selectedLinkIndex = -1

    const context = searchService.getContext(query)
    this.oldContextName = this.state.pluginName
    this.cContext = context
    
    this.setState({pluginName: context.name, inputValue: query})

    await this.setList()
  }

  getSlicedList(list, pageLimit) {
    return pageLimit === '*' ? list : list.slice(0, pageLimit)
  }

  async setList(items) {
    let selected = 0
    if (items) {
      selected = this.state.selected - (this.state.selected < items.length ? 0 : 1)
    }
    
    const fetchList = async () => {
      const promisedList = this.cContext.getList()
      this.setState({listLoading: true})
      const list = items || await promisedList
      if (this.state.listLoading || items) {
        this.setState({
          totalNumber: list.length,
          list: this.getSlicedList(list, this.props.pageLimit),
          selected,
          selectedTail: [],
          listLoading: false
        })
      }
  
      if (this.state.totalNumber > 0 || this.oldContextName !== this.cContext.name) {
        this.setState({preview: ''})
      }
      this.prepareWindowHeight()
    }

    if (this.cContext.config.async) {
      await new Promise(resolve =>
        this.asyncTimer = setTimeout(() => resolve(fetchList()), this.delay)
      )
    } else {
      await fetchList()
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
    if (this.state.isFullscreen) {
      setTimeout(() => {
        this.lastBodyHeight = document.getElementById('root').clientHeight
      })
      return
    }
    setTimeout(() => {
      const clientHeight = document.getElementById('root').clientHeight
      if (clientHeight !== this.lastBodyHeight) {
        this.lastBodyHeight = clientHeight
        setNewHeight(clientHeight)
      }
    })
  }

  focusLinkOnPreview(d) {
    const links = document.getElementsByClassName('preview-container')[0].querySelectorAll('a');
    if (links.length === 0) {
      return
    }
    const newIndex = this.selectedLinkIndex + d
    if ( (d > 0 && newIndex < links.length) || (d < 0 && newIndex > -1) ) {
      this.selectedLinkIndex = newIndex
      links[this.selectedLinkIndex].focus()
    }
  }
  
  selectNext(e) {
    this.stopEvent(e)
    if (this.state.preview) {
      this.focusLinkOnPreview(1)
    } else {
      let newState = {selectedTail: []}
      if(this.state.selected + 1 < this.state.list.length) {
        newState = {...newState, selected: this.state.selected + 1}
      }
      this.setState(newState)
    }
  }
  
  selectPrevious(e) {
    this.stopEvent(e)
    if (this.state.preview) {
      this.focusLinkOnPreview(-1)
    } else {
      let newState = {selectedTail: []}
      if(this.state.selected > 0) {
        newState = {...newState, selected: this.state.selected - 1}
      }
      this.setState(newState)
    }
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

  onEnterAction(item) {
    return this.cContext.onEnter(item, query => this.onChangeQuery(query), () => hideWindow())
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

  getLauncherContainerClassNames() {
    const classes = ['launcher-container']
    if (this.state.loading || this.state.listLoading) {
      classes.push('launcher-container--loading')
    }
    if (this.state.isFullscreen) {
      classes.push('launcher-container--fullscreen')
    }
    return classes.join(' ')
  }

  getPreviewContainerClassNames() {
    const classes = ['preview-container']
    if (!this.state.isFullscreen) {
      classes.push('preview-container--no-fullscreen')
    }
    return classes.join(' ')
  }

  getListContainerClassNames() {
    const classes = ['list-container']
    if (!this.state.isFullscreen) {
      classes.push('list-container--no-fullscreen')
    }
    return classes.join(' ')
  }

  render() {
    return (
      <div className={this.getLauncherContainerClassNames()}>
        <CentralityInput
          onChangeQuery={query => this.onChangeQuery(query)}
          onEnter={() => this.onEnter()}
          loading={this.state.loading}
          totalNumber={this.state.totalNumber}
          pluginName={this.state.pluginName}
          isPreview={!!this.state.preview}
          inputValue={this.state.inputValue}
          ref={ref => this.inputRef = ref&&ref.inputRef}
        />
        <div className="result-container">
          <If cond={!this.state.preview}>
            <div className={this.getListContainerClassNames()}>
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
            <div className={this.getPreviewContainerClassNames()}
              dangerouslySetInnerHTML={{__html: this.state.preview}}
            ></div>
          </If>
        </div>
      </div>
    );
  }
}

export default Launcher;