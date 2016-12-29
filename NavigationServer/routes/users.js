var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    apitoken = req.query.apitoken;

    res.json({error: "not implemented"});

});

module.exports = router;




