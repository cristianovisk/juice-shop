const config = require('config')

describe('/#/contact', () => {
  let comment, rating, submitButton, captcha

  protractor.beforeEach.login({ email: 'admin@' + config.get('application.domain'), password: '***REMOVED***' })

  beforeEach(() => {
    browser.get('/#/contact')
    comment = element(by.id('comment'))
    rating = element(by.css('.br-unit'))
    captcha = element(by.id('captchaControl'))
    submitButton = element(by.id('submitButton'))
    solveNextCaptcha()
  })

  describe('challenge "forgedFeedback"', () => {
    it('should be possible to provide feedback as another user', () => {
      browser.executeScript('document.getElementById("userId").removeAttribute("hidden");')
      browser.executeScript('document.getElementById("userId").removeAttribute("class");')

      const UserId = element(by.id('userId'))
      UserId.clear()
      UserId.sendKeys('2')
      comment.sendKeys('Picard stinks!')
      rating.click()

      submitButton.click()

      browser.get('/#/administration')
      const feedbackUserId = element.all(by.css('mat-row mat-cell.mat-column-user'))
      expect(feedbackUserId.last().getText()).toMatch('2')
    })

    protractor.expect.challengeSolved({ challenge: 'Forged Feedback' })
  })

  // xit('should sanitize script from comments to remove potentially malicious html', () => {
  //   comment.sendKeys('Sani<script>alert("ScriptXSS")</script>tizedScript')
  //   rating.click()

  //   submitButton.click()

  //   expectPersistedCommentToMatch(/SanitizedScript/)
  // })

  // xit('should sanitize image from comments to remove potentially malicious html', () => {
  //   comment.sendKeys('Sani<img src="alert("ImageXSS")"/>tizedImage')
  //   rating.click()

  //   submitButton.click()

  //   expectPersistedCommentToMatch(/SanitizedImage/)
  // })

  // xit('should sanitize iframe from comments to remove potentially malicious html', () => {
  //   comment.sendKeys('Sani<iframe src="alert("IFrameXSS")"></iframe>tizedIFrame')
  //   rating.click()

  //   submitButton.click()

  //   expectPersistedCommentToMatch(/SanitizedIFrame/)
  // })

  // describe('challenge "xss4"', () => {
  //   xit('should be possible to trick the sanitization with a masked XSS attack', () => {
  //     const EC = protractor.ExpectedConditions

  //     comment.sendKeys('<<script>Foo</script>script>alert("XSS")<</script>/script>')
  //     rating.click()

  //     submitButton.click()

  //     browser.get('/#/about')
  //     browser.wait(EC.alertIsPresent(), 5000, "'XSS' alert is not present")
  //     browser.switchTo().alert().then(alert => {
  //       expect(alert.getText()).toEqual('XSS')
  //       alert.accept()
  //     })

  //     browser.get('/#/administration')
  //     browser.wait(EC.alertIsPresent(), 5000, "'XSS' alert is not present")
  //     browser.switchTo().alert().then(alert => {
  //       expect(alert.getText()).toEqual('XSS')
  //       alert.accept()
  //       element.all(by.repeater('feedback in feedbacks')).last().element(by.css('.fa-trash-alt')).element(by.xpath('ancestor::a')).click()
  //     })
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'XSS Tier 4' })
  // })

  describe('challenge "vulnerableComponent"', () => {
    it('should be possible to post known vulnerable component(s) as feedback', () => {
      comment.sendKeys('sanitize-html 1.4.2 is non-recursive.')
      comment.sendKeys('express-jwt 0.1.3 has broken crypto.')
      rating.click()

      submitButton.click()
    })

    protractor.expect.challengeSolved({ challenge: 'Vulnerable Library' })
  })

  // describe('challenge "weirdCrypto"', () => {
  //   xit('should be possible to post weird crypto algorithm/library as feedback', () => {
  //     comment.sendKeys('The following libraries are bad for crypto: z85, base85, md5 and hashids')
  //     rating.click()

  //     submitButton.click()
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'Weird Crypto' })
  // })

  // describe('challenge "typosquattingNpm"', () => {
  //   xit('should be possible to post typosquatting NPM package as feedback', () => {
  //     comment.sendKeys('You are a typosquatting victim of this NPM package: epilogue-js')
  //     rating.click()

  //     submitButton.click()
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'Typosquatting Tier 1' })
  // })

  // describe('challenge "typosquattingBower"', () => {
  //   xit('should be possible to post typosquatting Bower package as feedback', () => {
  //     comment.sendKeys('You are a typosquatting victim of this Bower package: angular-tooltipps')
  //     rating.click()

  //     submitButton.click()
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'Typosquatting Tier 2' })
  // })

  // describe('challenge "hiddenImage"', () => {
  //   it('should be possible to post hidden character name as feedback', () => {
  //     comment.sendKeys('Pickle Rick is hiding behind one of the support team ladies')
  //     rating.click()

  //     submitButton.click()
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'Steganography Tier 1' })
  // })

  // describe('challenge "zeroStars"', () => { // FIXME Retrieve captcha first via $http.get() and then send id & captcha along with subsequent $http.post()
  //   xit('should be possible to post feedback with zero stars by double-clicking rating widget', () => {
  //     comment.sendKeys('No stars for ya here, yo!')
  //     rating.click()
  //     element(by.className('glyphicon-star')).click()

  //     submitButton.click()
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'Zero Stars' })
  // })

  // describe('challenge "captchaBypass"', () => {
  //   xit('should be possible to post 10 or more customer feedbacks in less than 10 seconds', () => {
  //     for (var i = 0; i < 11; i++) {
  //       comment.sendKeys('Spam #' + i)
  //       rating.click()
  //       submitButton.click()
  //       solveNextCaptcha() // first CAPTCHA was already solved in beforeEach
  //     }
  //   })

  //   protractor.expect.challengeSolved({ challenge: 'CAPTCHA Bypass' })
  // })

  function solveNextCaptcha () {
    element(by.id('captcha')).getText().then((text) => {
      const answer = eval(text).toString() // eslint-disable-line no-eval
      captcha.sendKeys(answer)
    })
  }

  // function expectPersistedCommentToMatch (expectation) {
  //   browser.get('/#/administration')
  //   const feedbackComments = element.all(by.repeater('feedback in feedbacks').column('comment'))
  //   expect(feedbackComments.last().getText()).toMatch(expectation)
  // }
})
