/*
 * Copyright (c) 2014-2021 Bjoern Kimminich.
 * SPDX-License-Identifier: MIT
 */

/* jslint node: true */
export = (sequelize, { STRING, INTEGER, BOOLEAN, NUMBER }) => {
  const Challenge = sequelize.define('Challenge', {
    key: STRING,
    name: STRING,
    category: STRING,
    tags: STRING,
    description: STRING,
    difficulty: INTEGER,
    hint: STRING,
    hintUrl: STRING,
    mitigationUrl: STRING,
    solved: BOOLEAN,
    disabledEnv: STRING,
    tutorialOrder: NUMBER,
    findIt: BOOLEAN,
    fixIt: BOOLEAN
  })
  return Challenge
}
