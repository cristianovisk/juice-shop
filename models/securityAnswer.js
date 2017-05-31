/* jslint node: true */
'use strict'

var insecurity = require('../lib/insecurity')

module.exports = function (sequelize, DataTypes) {
  var SecurityAnswer = sequelize.define('SecurityAnswer', {
    answer: DataTypes.STRING
  },
    {
      classMethods: {
        associate: function (models) {
          SecurityAnswer.belongsTo(models.User, { constraints: true, foreignKeyConstraint: true, unique: true })
          SecurityAnswer.belongsTo(models.SecurityQuestion, { constraints: true, foreignKeyConstraint: true })
        }
      },
      hooks: {
        beforeCreate: function (answer, fn) {
          hmacAnswerHook(answer)
          fn(null, answer)
        },
        beforeUpdate: function (answer, fn) { // Pitfall: Will hash the hashed answer again if answer was not updated!
          hmacAnswerHook(answer)
          fn(null, answer)
        }
      }
    })
  return SecurityAnswer
}

function hmacAnswerHook (answer) {
  if (answer.answer) {
    answer.answer = insecurity.hmac(answer.answer)
  };
}
