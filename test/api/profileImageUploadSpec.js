const frisby = require('frisby')
const fs = require('fs')
const path = require('path')
const config = require('config')

const jsonHeader = { 'content-type': 'application/json' }
const REST_URL = 'http://localhost:3000/rest'
const URL = 'http://localhost:3000'

xdescribe('/profile/image/file', () => { // FIXME Socket hang-up and other server problems
  it('POST profile image file valid for JPG format', () => {
    const file = path.resolve(__dirname, '../files/validProfileImage.jpg')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file))

    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get('application.domain'),
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.post(URL + '/profile/image/file', {
          headers: {
            'Authorization': 'Bearer ' + jsonLogin.authentication.token,
            'Content-Type': form.getHeaders()['content-type']
          },
          body: form
        })
          .expect('status', 204)
      })
  })

  it('POST profile image file invalid type', () => {
    const file = path.resolve(__dirname, '../files/invalidProfileImageType.exe')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file))

    return frisby.post(REST_URL + '/user/login', {
      headers: jsonHeader,
      body: {
        email: 'jim@' + config.get('application.domain'),
        password: 'ncc-1701'
      }
    })
      .expect('status', 200)
      .then(({ json: jsonLogin }) => {
        return frisby.post(URL + '/profile/image/file', {
          headers: {
            'Authorization': 'Bearer ' + jsonLogin.authentication.token,
            'Content-Type': form.getHeaders()['content-type']
          },
          body: form
        })
          .expect('status', 415)
          .expect('header', 'content-type', /text\/html/)
          .expect('bodyContains', '<h1>' + config.get('application.name') + ' (Express')
          .expect('bodyContains', 'Error: Profile image upload does not accept this file type')
      })
  })

  it('POST profile image file forbidden for anonymous user', () => {
    const file = path.resolve(__dirname, '../files/validProfileImage.jpg')
    const form = frisby.formData()
    form.append('file', fs.createReadStream(file))

    return frisby.post(URL + '/profile/image/file', {
      headers: { 'Content-Type': form.getHeaders()['content-type'] },
      body: form
    })
      .expect('status', 500)
      .expect('header', 'content-type', /text\/html/)
      .expect('bodyContains', '<h1>' + config.get('application.name') + ' (Express')
      .expect('bodyContains', 'Error: Blocked illegal activity')
  })
})
