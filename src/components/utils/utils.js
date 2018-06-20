

export const If = props => {
  return props.cond ? props.children : ''
}

export const For = props => {
  return props.list.map((item, i) => props.fn(item, i))
}