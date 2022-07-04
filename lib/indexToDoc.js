const expressions = require('./expressions')
const path = require('path')
const requireToDoc = require('./requireToDoc')
const prettyText = require('./prettyText')

module.exports = (code, codeModule) => {
  // Converts raw index code to Markdown API documentation.
  // Is called recursively.
  //
  // Parameters
  //   code
  //     string. The raw CommonJS source code.
  //   codeModule
  //     object with properties
  //       intro
  //         string. markdown from above to insert immediately after the title.
  //       name
  //         string. The module name as written in code.
  //       path
  //         string. The path to code file
  //       title
  //         optional string. Title to use instead of the module name.
  //
  // Return
  //   string as Markdown
  //
  const lines = code.split(/\r?\n/)
  let doc = '' // reusable doc aggregate

  let titleOutput = ''
  let introOutput = codeModule.intro
  let tocOutput = ''
  let membersOutput = ''

  if (codeModule.title) {
    titleOutput = '## ' + codeModule.title + '\n\n'
  } else {
    titleOutput = '## ' + codeModule.name + '\n\n'
  }

  lines.forEach((line) => {

    const found = line.match(expressions.comment)
    if (found) {
      const text = found[1] // first captured string
      doc += text + '\n'

      return
    }

    const foundReq = line.match(expressions.exportsRequire)
    if (foundReq) {
      const moduleName = codeModule.name + '.' + foundReq[1]
      const relativePath = foundReq[2]
      const absPath = path.resolve(codeModule.path, relativePath)
      const requireDoc = requireToDoc({
        intro: doc,
        name: moduleName,
        path: absPath,
        indexToDoc: module.exports // HACK prevent cyclic require
      })

      membersOutput += requireDoc
      const hashName = '#' + moduleName.replace(expressions.hashPath, '')
      tocOutput += '- [' + moduleName + '](' + hashName + ')\n'
      // doc consumed
      doc = ''

      return
    }

    const foundAlias = line.match(expressions.exportsAlias)
    if (foundAlias) {
      const exportedName = foundAlias[1]
      const aliasOf = foundAlias[2]
      const fullname = codeModule.name + '.' + exportedName

      membersOutput += '### ' + fullname + '\n\n'
      if (doc.trim().length > 0) {
        membersOutput += prettyText(doc) + '\n'
      }
      membersOutput += 'Alias of `' + codeModule.name + '.' + aliasOf + '`.\n\n'
      const hashName = '#' + fullname.replace(expressions.hashPath, '')
      tocOutput += '- [' + fullname + '](' + hashName + ')\n'
      // doc consumed
      doc = ''

      return
    }

    // not a comment, not a require, not an alias
    const foundConstant = line.match(expressions.exportsConstant)
    if (foundConstant) {
      const exportedName = foundConstant[1]
      const value = foundConstant[2]
      const fullname = codeModule.name + '.' + exportedName

      membersOutput += '### ' + fullname + '\n\n'
      membersOutput += prettyText(doc) + '\n'
      const hashName = '#' + fullname.replace(expressions.hashPath, '')
      tocOutput += '- [' + fullname + '](' + hashName + ')\n'
      // doc consumed
      doc = ''

      return
    }

    // Empty line or something. Output doc gathered this far.

    introOutput += prettyText(doc)
    doc = ''
  })

  return [
    titleOutput,
    introOutput.trim(),
    '\n\n',
    tocOutput.trim(),
    '\n\n',
    membersOutput
  ].join('')
}