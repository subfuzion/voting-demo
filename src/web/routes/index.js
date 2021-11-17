const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
  let  data = {
    message: 'Hello world!',
    layout:  'layout.njk',
    title: 'Nunjucks example'
  }

  res.render('index.njk', data)
});

module.exports = router;
