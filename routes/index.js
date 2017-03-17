var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/private*', function(req, res, next) {
  res.render('private');
});
module.exports = router;
