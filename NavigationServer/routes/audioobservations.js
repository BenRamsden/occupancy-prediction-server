/**
 * Created by benra on 04/12/2016.
 */

var express = require('express');
var router = express.Router();
var mysqlpool = require('../mysqlpool');
var async = require("async");

/* GET hotspots listing. */
router.get('/', function(req, res, next) {
    apitoken = req.query.apitoken;

    async.series([
        function(callback) {
            /* Check if client included apitoken query paramater */
            if(!apitoken) return callback(new Error("Incorrect query parameters"));

            /* Get idUser of user if api token is provided */
            mysqlpool.getConnection(function(err, con) {
                if(err) return callback(err);

                con.query('select idUser from users WHERE api_token = ?', [apitoken], function(err, result) {
                    if(err) return callback(err);

                    if(result.length == 0) return callback(new Error("Api Token not valid"));

                    idUser = result.idUser;

                    con.release();
                    callback();
                });
            });
        },
        function (callback) {
            mysqlpool.getConnection(function(err, con) {
                if(err) return callback(err);

                con.query('select * from audioobservations WHERE idUser = ?', [idUser], function(err, result) {
                    if(err) return callback(err);

                    con.release();
                    res.send(result);
                    callback();
                });
            });
        }
    ],
        function(err) { //This function gets called after the two tasks have called their "task callbacks"
            if (err) res.json({error:err.message});
        }
    );

}).post('/', function(req, res, next) {
    res.send("Hey from POST");
});

module.exports = router;