/* jslint node: true */
const models = require('../models/index')
const datacache = require('./datacache')
const config = require('config')
const utils = require('../lib/utils')
const mongodb = require('./mongodb')
const insecurity = require('../lib/insecurity')
const logger = require('../lib/logger')

const fs = require('fs')
const path = require('path')
const util = require('util')
const { safeLoad } = require('js-yaml')

const readFile = util.promisify(fs.readFile)

function loadStaticData (file) {
  const filePath = path.resolve('./data/static/' + file + '.yml')
  return readFile(filePath, 'utf8')
    .then(safeLoad)
    .catch(() => logger.error('Could not open file: "' + filePath + '"'))
}

module.exports = async () => {
  const creators = [
    createSecurityQuestions,
    createUsers,
    createChallenges,
    createRandomFakeUsers,
    createProducts,
    createBaskets,
    createBasketItems,
    createAnonymousFeedback,
    createComplaints,
    createRecycleItems,
    createOrders
  ]

  for (const creator of creators) {
    await creator()
  }
}

async function createChallenges () {
  const showHints = config.get('application.showChallengeHints')

  const challenges = await loadStaticData('challenges')

  await Promise.all(
    challenges.map(async ({ name, category, description, difficulty, hint, hintUrl, key, disabledEnv }) => {
      const effectiveDisabledEnv = utils.determineDisabledContainerEnv(disabledEnv)
      try {
        const challenge = await models.Challenge.create({
          key,
          name,
          category,
          description: effectiveDisabledEnv ? (description + ' <em>(This challenge is <strong>' + (config.get('challenges.safetyOverride') ? 'potentially harmful' : 'not available') + '</strong> on ' + effectiveDisabledEnv + '!)</em>') : description,
          difficulty,
          solved: false,
          hint: showHints ? hint : null,
          hintUrl: showHints ? hintUrl : null,
          disabledEnv: config.get('challenges.safetyOverride') ? null : effectiveDisabledEnv
        })
        datacache.challenges[key] = challenge
      } catch (err) {
        logger.error(`Could not insert Challenge ${name}: ${err.message}`)
      }
    })
  )
}

async function createUsers () {
  const users = await loadStaticData('users')

  await Promise.all(
    users.map(async ({ username, email, password, customDomain, key, isAdmin, deletedFlag, profileImage, securityQuestion, feedback, totpSecret: totpSecret = '' }) => {
      try {
        const completeEmail = customDomain ? email : `${email}@${config.get('application.domain')}`
        const user = await models.User.create({
          username,
          email: completeEmail,
          password,
          isAdmin,
          profileImage: profileImage || 'default.svg',
          totpSecret
        })
        datacache.users[key] = user
        if (securityQuestion) await createSecurityAnswer(user.id, securityQuestion.id, securityQuestion.answer)
        if (feedback) await createFeedback(user.id, feedback.comment, feedback.rating)
        if (deletedFlag) await deleteUser(user.id)
      } catch (err) {
        logger.error(`Could not insert User ${key}: ${err.message}`)
      }
    })
  )
}

function deleteUser (userId) {
  return models.User.destroy({ where: { id: userId } }).catch((err) => {
    logger.error(`Could not perform soft delete for the user ${userId}: ${err.message}`)
  })
}

function createRandomFakeUsers () {
  function getGeneratedRandomFakeUserEmail () {
    const randomDomain = makeRandomString(4).toLowerCase() + '.' + makeRandomString(2).toLowerCase()
    return makeRandomString(5).toLowerCase() + '@' + randomDomain
  }

  function makeRandomString (length) {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

    for (let i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)) }

    return text
  }

  return Promise.all(new Array(config.get('application.numberOfRandomFakeUsers')).fill(0).map(
    () => models.User.create({
      email: getGeneratedRandomFakeUserEmail(),
      password: makeRandomString(5)
    })
  ))
}

function createProducts () {
  const products = utils.thaw(config.get('products')).map((product) => {
    // set default price values
    product.price = product.price || Math.floor(Math.random())
    product.description = product.description || 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.'

    // set default image values
    product.image = product.image || 'undefined.png'
    if (utils.startsWith(product.image, 'http')) {
      const imageUrl = product.image
      product.image = decodeURIComponent(product.image.substring(product.image.lastIndexOf('/') + 1))
      utils.downloadToFile(imageUrl, 'frontend/dist/frontend/assets/public/images/products/' + product.image)
    }

    // set deleted at values if configured
    if (product.deletedDate) {
      product.deletedAt = product.deletedDate
      delete product.deletedDate
    }

    return product
  })

  // add Challenge specific information
  const chrismasChallengeProduct = products.find(({ useForChristmasSpecialChallenge }) => useForChristmasSpecialChallenge)
  const pastebinLeakChallengeProduct = products.find(({ keywordsForPastebinDataLeakChallenge }) => keywordsForPastebinDataLeakChallenge)
  const tamperingChallengeProduct = products.find(({ urlForProductTamperingChallenge }) => urlForProductTamperingChallenge)
  const blueprintRetrivalChallengeProduct = products.find(({ fileForRetrieveBlueprintChallenge }) => fileForRetrieveBlueprintChallenge)

  chrismasChallengeProduct.description += ' (Seasonal special offer! Limited availability!)'
  chrismasChallengeProduct.deletedAt = '2014-12-27 00:00:00.000 +00:00'
  tamperingChallengeProduct.description += ' <a href="' + tamperingChallengeProduct.urlForProductTamperingChallenge + '" target="_blank">More...</a>'
  tamperingChallengeProduct.deletedAt = null
  pastebinLeakChallengeProduct.description += ' (This product is unsafe! We plan to remove it from the stock!)'
  pastebinLeakChallengeProduct.deletedAt = '2019-02-1 00:00:00.000 +00:00'

  let blueprint = blueprintRetrivalChallengeProduct.fileForRetrieveBlueprintChallenge
  if (utils.startsWith(blueprint, 'http')) {
    const blueprintUrl = blueprint
    blueprint = decodeURIComponent(blueprint.substring(blueprint.lastIndexOf('/') + 1))
    utils.downloadToFile(blueprintUrl, 'frontend/dist/frontend/assets/public/images/products/' + blueprint)
  }
  datacache.retrieveBlueprintChallengeFile = blueprint // TODO Do not cache separately but load from config where needed (same as keywordsForPastebinDataLeakChallenge)

  return Promise.all(
    products.map(
      ({ reviews = [], useForChristmasSpecialChallenge = false, urlForProductTamperingChallenge = false, ...product }) =>
        models.Product.create(product).catch(
          (err) => {
            logger.error(`Could not insert Product ${product.name}: ${err.message}`)
          }
        ).then((persistedProduct) => {
          if (useForChristmasSpecialChallenge) { datacache.products.christmasSpecial = persistedProduct }
          if (urlForProductTamperingChallenge) {
            datacache.products.osaft = persistedProduct
            datacache.challenges.changeProductChallenge.update({ description: customizeChangeProductChallenge(
              datacache.challenges.changeProductChallenge.description,
              config.get('challenges.overwriteUrlForProductTamperingChallenge'),
              persistedProduct)
            })
          }
          return persistedProduct
        })
          .then(({ id }) =>
            Promise.all(
              reviews.map(({ text, author }) =>
                mongodb.reviews.insert({
                  message: text,
                  author: `${author}@${config.get('application.domain')}`,
                  product: id,
                  likesCount: 0,
                  likedBy: []
                }).catch((err) => {
                  logger.error(`Could not insert Product Review ${text}: ${err.message}`)
                })
              )
            )
          )
    )
  )

  function customizeChangeProductChallenge (description, customUrl, customProduct) {
    let customDescription = description.replace(/OWASP SSL Advanced Forensic Tool \(O-Saft\)/g, customProduct.name)
    customDescription = customDescription.replace('https://owasp.slack.com', customUrl)
    return customDescription
  }
}

function createBaskets () {
  const baskets = [
    { UserId: 1 },
    { UserId: 2 },
    { UserId: 3 },
    { UserId: 11 }
  ]

  return Promise.all(
    baskets.map(basket => {
      models.Basket.create(basket).catch((err) => {
        logger.error(`Could not insert Basket for UserId ${basket.UserId}: ${err.message}`)
      })
    })
  )
}

function createBasketItems () {
  const basketItems = [
    {
      BasketId: 1,
      ProductId: 1,
      quantity: 2
    },
    {
      BasketId: 1,
      ProductId: 2,
      quantity: 3
    },
    {
      BasketId: 1,
      ProductId: 3,
      quantity: 1
    },
    {
      BasketId: 2,
      ProductId: 4,
      quantity: 2
    },
    {
      BasketId: 3,
      ProductId: 5,
      quantity: 1
    },
    {
      BasketId: 4,
      ProductId: 4,
      quantity: 2
    }
  ]

  return Promise.all(
    basketItems.map(basketItem => {
      models.BasketItem.create(basketItem).catch((err) => {
        logger.error(`Could not insert BasketItem for BasketId ${basketItem.BasketId}: ${err.message}`)
      })
    })
  )
}

function createAnonymousFeedback () {
  const feedbacks = [
    {
      comment: 'Incompetent customer support! Can\'t even upload photo of broken purchase!<br><em>Support Team: Sorry, only order confirmation PDFs can be attached to complaints!</em>',
      rating: 2
    },
    {
      comment: 'This is <b>the</b> store for awesome stuff of all kinds!',
      rating: 4
    },
    {
      comment: 'Never gonna buy anywhere else from now on! Thanks for the great service!',
      rating: 4
    },
    {
      comment: 'Keep up the good work!',
      rating: 3
    }
  ]

  return Promise.all(
    feedbacks.map((feedback) => createFeedback(null, feedback.comment, feedback.rating))
  )
}

function createFeedback (UserId, comment, rating) {
  return models.Feedback.create({ UserId, comment, rating }).catch((err) => {
    logger.error(`Could not insert Feedback ${comment} mapped to UserId ${UserId}: ${err.message}`)
  })
}

function createComplaints () {
  return models.Complaint.create({
    UserId: 3,
    message: 'I\'ll build my own eCommerce business! With Black Jack! And Hookers!'
  }).catch((err) => {
    logger.error(`Could not insert Complaint: ${err.message}`)
  })
}

function createRecycleItems () {
  const recycleItems = [
    {
      UserId: 2,
      quantity: 800,
      address: 'Starfleet HQ, 24-593 Federation Drive, San Francisco, CA',
      date: '2270-01-17',
      isPickup: true
    },
    {
      UserId: 3,
      quantity: 1320,
      address: '22/7 Winston Street, Sydney, Australia, Earth',
      date: '2006-01-14',
      isPickup: true
    },
    {
      UserId: 4,
      quantity: 120,
      address: '999 Norton Street, Norfolk, USA',
      date: '2018-04-16',
      isPickup: true
    },
    {
      UserId: 1,
      quantity: 300,
      address: '6-10 Leno Towers, Eastern Empire, CA',
      date: '2018-01-17',
      isPickup: true
    },
    {
      UserId: 6,
      quantity: 350,
      address: '88/2 Lindenburg Apartments, East Street, Oslo, Norway',
      date: '2018-03-17',
      isPickup: true
    },
    {
      UserId: 3,
      quantity: 200,
      address: '222, East Central Avenue, Adelaide, New Zealand',
      date: '2018-07-17',
      isPickup: true
    },
    {
      UserId: 4,
      quantity: 140,
      address: '100 Yellow Peak Road, West Central New York, USA',
      date: '2018-03-19',
      isPickup: true
    },
    {
      UserId: 1,
      quantity: 150,
      address: '15 Riviera Road, Western Frontier, Menlo Park CA',
      date: '2018-05-12',
      isPickup: true
    },
    {
      UserId: 8,
      quantity: 500,
      address: '712 Irwin Avenue, River Bank Colony, Easter Frontier, London, UK',
      date: '2019-02-18',
      isPickup: true
    }
  ]
  return Promise.all(
    recycleItems.map((item) => createRecycles(item))
  )
}

function createRecycles (item) {
  return models.Recycle.create(item).catch((err) => {
    logger.error(`Could not insert Recycling Model: ${err.message}`)
  })
}

function createSecurityQuestions () {
  const questions = [
    'Your eldest siblings middle name?',
    'Mother\'s maiden name?',
    'Mother\'s birth date? (MM/DD/YY)',
    'Father\'s birth date? (MM/DD/YY)',
    'Maternal grandmother\'s first name?',
    'Paternal grandmother\'s first name?',
    'Name of your favorite pet?',
    'Last name of dentist when you were a teenager? (Do not include \'Dr.\')',
    'Your ZIP/postal code when you were a teenager?',
    'Company you first work for as an adult?'
  ]

  return Promise.all(
    questions.map((question) => models.SecurityQuestion.create({ question }).catch((err) => {
      logger.error(`Could not insert SecurityQuestion ${question}: ${err.message}`)
    }))
  )
}

function createSecurityAnswer (UserId, SecurityQuestionId, answer) {
  return models.SecurityAnswer.create({ SecurityQuestionId, UserId, answer }).catch((err) => {
    logger.error(`Could not insert SecurityAnswer ${answer} mapped to UserId ${UserId}: ${err.message}`)
  })
}

function createOrders () {
  const email = 'admin@' + config.get('application.domain')
  const products = config.get('products')
  const basket1Products = [
    {
      quantity: 3,
      name: products[0].name,
      price: products[0].price,
      total: products[0].price * 3
    },
    {
      quantity: 1,
      name: products[1].name,
      price: products[1].price,
      total: products[1].price * 1
    }
  ]

  const basket2Products = [
    {
      quantity: 3,
      name: products[2].name,
      price: products[2].price,
      total: products[2].price * 3
    }
  ]

  const orders = [
    {
      orderId: insecurity.hash(email).slice(0, 4) + '-' + utils.randomHexString(16),
      email: (email ? email.replace(/[aeiou]/gi, '*') : undefined),
      totalPrice: basket1Products[0].total + basket1Products[1].total,
      products: basket1Products,
      eta: Math.floor((Math.random() * 5) + 1).toString()
    },
    {
      orderId: insecurity.hash(email).slice(0, 4) + '-' + utils.randomHexString(16),
      email: (email ? email.replace(/[aeiou]/gi, '*') : undefined),
      totalPrice: basket2Products[0].total,
      products: basket2Products,
      eta: Math.floor((Math.random() * 5) + 1).toString()
    }
  ]

  return Promise.all(
    orders.map(({ orderId, email, totalPrice, products, eta }) =>
      mongodb.orders.insert({
        orderId: orderId,
        email: email,
        totalPrice: totalPrice,
        products: products,
        eta: eta
      }).catch((err) => {
        logger.error(`Could not insert Order ${orderId}: ${err.message}`)
      })
    )
  )
}
