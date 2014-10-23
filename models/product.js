/*jslint node: true */
'use strict';

module.exports = function (sequelize, DataTypes) {
    var Product = sequelize.define('Product', {
            name: DataTypes.STRING,
            description: DataTypes.STRING,
            price: DataTypes.DECIMAL,
            image: DataTypes.STRING
        }, {
            classMethods: {
                associate: function (models) {
                    Product.hasMany(models.Basket, {through: models.BasketItem});
                }},

            hooks: {
                beforeCreate: function (product, fn) {
                    xssChallengeProductHook(product);
                    fn(null, product);
                },
                beforeUpdate: function (product, fn) {
                    xssChallengeProductHook(product);
                    fn(null, product);
                }
            }});
    return Product;
};

function xssChallengeProductHook(product) {
    /*
     if (notSolved(restfulXssChallenge) && utils.contains(product.description, '<script>alert("XSS4")</script>')) {
     solve(restfulXssChallenge);
     }
     */
}