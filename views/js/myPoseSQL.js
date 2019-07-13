var express = require('express');
var router = express.Router();

router.get('/myPose', function(req, res, next) {
    console.log('mypose');
    res.send('hello world!!');
});