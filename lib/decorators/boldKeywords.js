
const mapListValues = require('./utils/mapListValues')
const mapBlockParagraphs = require('./utils/mapBlockParagraphs')
const setParagraphBody = require('./utils/setParagraphBody')

module.exports = (keywords) => {
  // yadog.decorators.boldKeywords
  //
  // Bolds the given keywords using Markdown &ast;bold&ast; syntax.
  //
  // Parameters
  //   keywords
  //     array of strings or regexp objects
  //
  // Return
  //   a function, a decorator function.
  //

  const len = keywords.length

  const replacer = (match) => {
    return '*' + match + '*'
  }

  const applyToLine = (line) => {
    for (let i = 0; i < len; i += 1) {
      line = line.replace(keywords[i], replacer)
    }
    return line
  }

  return (block) => {
    return mapBlockParagraphs(block, (par) => {
      switch (par.type) {
        case 'text':
          return setParagraphBody(par, applyToLine(par.body))
        case 'list':
          return setParagraphBody(par, mapListValues(par.body, applyToLine))
        default:
          return par
      }
    })
  }
}