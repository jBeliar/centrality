import { eval as mathEval } from 'mathjs'

const preview = query => {
  try {
    const result = mathEval(query)
    return `<div class="bigger">=${result}</div>`
  } catch(e) {
    return ''
  }
}
export const plugin = tools => {
  return {
    name: 'Math',
    keyword: '=',
    preview
  }
}