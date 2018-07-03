import { shell, clipboard } from 'electron'
import groupBy from 'lodash/groupBy';
import { loadJsonAsync } from '../utils/file-utils';

const selectedFontColor = 'green'

const normalize = string => string ? (string + '').toUpperCase() : ''
const includes = (string, substring) => normalize(string).includes(normalize(substring))
const startsWith = (string, substring) => normalize(string).startsWith(normalize(substring))
const escapeStringRegExp = string => string.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')

const addHighlight = (item, query, isInMiddle) => {
  const additional = isInMiddle ? 'g' : ''
  return {
    ...item,
    viewValue: item.value.replace(new RegExp(escapeStringRegExp(query), 'i' + additional), machted => {
      return `<span style="color:${selectedFontColor};">${machted}</span>`
    })
  }
}
const addDistributedHighlight = (item, query) => {
  return {
    ...item,
    value: item.value.replace(new RegExp(escapeStringRegExp(query).split(' ').join('|'), 'gi'), machted => {
      return `<span style="color:${selectedFontColor};">${machted}</span>`
    })
  }
}

const mapToTypeFind = (itemValue, query) => {
  if ( startsWith(itemValue, query) ) {
    return "startWith"
  } else if( includes(itemValue, query) ) {
    return "contain"
  } else if ( query.split(' ').every(queryWord => includes(itemValue, queryWord)) ) {
    return "distributed"
  } else {
    return "other"
  }
}

const groupList = (list, query) => groupBy(list, item => mapToTypeFind(item.value, query))

export class PluginToolsApi {

  static openExternal(url) {
    shell.openExternal(url)
  }

  static copy(query) {
    clipboard.writeText(query)
  }

  static filterList(list, query) {
    const {            
      startWith: starteWithQuery = [],            
      contain: containQuery = [],            
      distributed: distributedQuery = []            
    } = groupList(list, query)
          
    return [
      ...starteWithQuery.map(item => addHighlight(item, query, false)),
      ...containQuery.map(item => addHighlight(item, query, true)),
      ...distributedQuery.map(item => addDistributedHighlight(item,query))
    ]
  }

  static loadJsonAsync(path) {
    return loadJsonAsync(path)
  }
}