const utils = require('../lib/utils')
const challenges = require('../data/datacache').challenges
const libxml = require('libxmljs')
const vm = require('vm')

exports = module.exports = function fileUpload () {
  return (req, res, next) => {
    const file = req.file
    if (utils.notSolved(challenges.uploadSizeChallenge) && file.size > 100000) {
      utils.solve(challenges.uploadSizeChallenge)
    }
    if (utils.notSolved(challenges.uploadTypeChallenge) && !(utils.endsWith(file.originalname.toLowerCase(), '.pdf') ||
        utils.endsWith(file.originalname.toLowerCase(), '.xml'))) {
      utils.solve(challenges.uploadTypeChallenge)
    }
    if (utils.endsWith(file.originalname.toLowerCase(), '.xml')) {
      if (utils.notSolved(challenges.deprecatedInterfaceChallenge)) {
        utils.solve(challenges.deprecatedInterfaceChallenge)
      }
      if (file.buffer) {
        const data = file.buffer.toString()
        res.status(410)
        try {
          const sandbox = { libxml, data }
          vm.createContext(sandbox)
          const xmlDoc = vm.runInContext('libxml.parseXml(data, { noblanks: true, noent: true, nocdata: true })', sandbox, { timeout: 2000 })
          const xmlString = xmlDoc.toString()
          if (utils.notSolved(challenges.xxeFileDisclosureChallenge) && (matchesSystemIniFile(xmlString) || matchesEtcPasswdFile(xmlString))) {
            utils.solve(challenges.xxeFileDisclosureChallenge)
          }
          next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + xmlString))
        } catch (err) {
          next(new Error('B2B customer complaints via file upload have been deprecated for security reasons: ' + err.message))
        }
      }
    }
    res.status(204).end()
  }

  function matchesSystemIniFile (text) {
    const match = text.match(/(; for 16-bit app support|drivers|mci|driver32|386enh|keyboard|boot|display)/gi)
    return match && match.length >= 2
  }

  function matchesEtcPasswdFile (text) {
    const match = text.match(/\w*:\w*:\d*:\d*:\w*:.*/gi)
    return match && match.length >= 2
  }
}
