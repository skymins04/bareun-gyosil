var express = require('express');
var expressLayouts = require('express-ejs-layouts');
var mysql = require('mysql');
var os = require('os');
var logger = require('morgan');
var fs = require('fs');

var app = express();
var VERSION = '0.1.0';
var PORT = 3000;

function getServerIp() {
    var ifaces = os.networkInterfaces();
    var result = '';
    for (var dev in ifaces) {
        var alias = 0;
        ifaces[dev].forEach(function(details) {
            if (details.family == 'IPv4' && details.internal === false) {
                result = details.address;
                ++alias;
            }
        });
    } 
    return result;
}

app.set('views', __dirname+'/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/views'));　

app.set('layout', 'layout');
app.set("layout extractScripts", true);
app.use(expressLayouts);

var studyTime = {study: 0, period: 0};
var stringJson = JSON.stringify(studyTime) + '\n';
fs.truncate(__dirname+'/views/studyTime.json', 0, function(){console.log('done')})
fs.open(__dirname+'/views/studyTime.json', 'a', '666', function(err, id){
if(err) console.log('file open err!!');
    else {
        fs.write(id, stringJson, null, 'utf8', function(err) {
            console.log('file was saved!');
        });
    }
});


// morgan logger setting
app.use(logger(":remote-addr"), function(req, res, next){next();});
app.use(logger(":method"), function(req, res, next){next();});
app.use(logger(":url"), function(req, res, next){next();});
app.use(logger(":date"), function(req, res, next){next();});
app.use(logger(":status"), function(req, res, next){next();});
var test = 1;
// route options
app.get('/', function(req, res){
    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: 'betaman',
        password: 'msms0257',
        database: 'KCTF2019'
    });
    sqlClient.connect();
    sqlClient.query('SELECT * FROM devices', function(err, rows) {
        if(!err) {
            console.log('The solution is ', rows);
            res.render('index', {device:rows, mode:0, score: []});
        }
        else console.log('Error while performing Query. ', err);
    });
    
    sqlClient.end();
    //res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/class', function(req, res){
    res.render('class', {mode: 0, score: 0});
    //res.sendFile(path.join(__dirname, 'public', 'class.html'));
});
app.get('/device', function(req, res) {
    res.render('device', {mode: 0});
    //res.sendFile(path.join(__dirname, 'public', 'device.html'))
});
app.get('/myPose', function(req, res) {
    var device = req.query.deviceName;
    var time = req.query.time;
    var SQL = "";
    if(time == 0) SQL = "SELECT * FROM period_1 UNION SELECT * FROM period_2 UNION SELECT * FROM period_3;";
    else SQL = "SELECT * FROM period_"+String(time);

    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "device_"+String(device)
    });
    sqlClient.connect();
    sqlClient.query(SQL, function(err, rows) {
        if(!err) {
            var score = [];
            rows.forEach(function(item) {
                score.push(item.score);
            })

            sqlClient = mysql.createConnection({
                host: '127.0.0.1',
                user: 'betaman',
                password: 'msms0257',
                database: 'KCTF2019'
            });
            sqlClient.connect();
            sqlClient.query('SELECT * FROM devices', function(err, rows) {
                if(!err) {
                    console.log('The solution is ', rows);
                    res.render('index', {device:rows, mode:1, score: score});
                }
                else console.log('Error while performing Query. ', err);
            });
        }
    });
    sqlClient.end();
});
app.get('/ranking', function(req, res) {
    var time = req.query.time;
    var SQL = "";
    if(time == 0) SQL = "SELECT * FROM period_1 UNION SELECT * FROM period_2 UNION SELECT * FROM period_3;";
    else SQL = "SELECT * FROM period_"+String(time);

    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "device_1"
    });
    sqlClient.connect();
    sqlClient.query(SQL, function(err, rows) {
        if(!err) {
            var scores = [];
            rows.forEach(function(item) {
                scores.push(item.score);
            });
            res.render('class', {mode: 1, score: scores});
        }
    });
    sqlClient.end();
});
app.get('/getAvg', function(req, res) {
    var SQL = "SELECT * FROM period_1 UNION SELECT * FROM period_2 UNION SELECT * FROM period_3;";
    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "device_1"
    });
    sqlClient.connect();
    sqlClient.query(SQL, function(err, rows) {
        if(!err) {
            var score = 0;
            var i = 0;
            rows.forEach(function(item) {
                score += item.score;
                i += 1;
            });
            score /= i;
            score = score.toFixed(1);
            res.send("{"+String(score));
        }
    });
    sqlClient.end();
});
app.get('/studyTime', function(req, res) {
    res.render('studyTime', {mode: 0});
});
app.get('/reqToDev', function(req, res) {
    var studyTime = {study: 1, period: (req.query.time * 1)};
    var stringJson = JSON.stringify(studyTime) + '\n';
    fs.truncate(__dirname+'/views/studyTime.json', 0, function(){console.log('done')})
    fs.open(__dirname+'/views/studyTime.json', 'a', '666', function(err, id){
        if(err) console.log('file open err!!');
        else {
            fs.write(id, stringJson, null, 'utf8', function(err) {
                console.log('file was saved!');
            });
        }
    });
    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "device_1"
    });
    sqlClient.connect();
    sqlClient.query('DELETE FROM period_'+req.query.time, function(err, rows) {});
    sqlClient.query('ALTER TABLE period_'+req.query.time+" AUTO_INCREMENT=1", function(err, rows) {});

    res.render('studyTime', {mode: 1});
});
app.get('/insertDB', function(req, res) {
    var table = 'period_'+req.query.period;
    var score =  ''+req.query.score;
    var SQL = 'INSERT INTO '+table+'(score) VALUE ('+score+')'

    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "device_1"
    });
    sqlClient.connect();
    sqlClient.query(SQL, function(err) {
        if(!err) console.log('done');
    });
    sqlClient.end();
    res.send('OK');
});
app.get('/studyJSON', function(req, res) {
    fs.readFile(__dirname+'/views/studyTime.json', function(err, data) {
        res.json(JSON.parse(data));
        console.log('parsed study json');
    });
});
app.get('/stopStudy', function(req, res) {
    var studyTime = {study: 0, period: 0};
    var stringJson = JSON.stringify(studyTime) + '\n';
    fs.truncate(__dirname+'/views/studyTime.json', 0, function(){console.log('done')})
    fs.open(__dirname+'/views/studyTime.json', 'a', '666', function(err, id){
        if(err) console.log('file open err!!');
        else {
            fs.write(id, stringJson, null, 'utf8', function(err) {
                console.log('file was saved!');
            });
        }
    });
    res.send('OK');
});
app.get('/appendDev', function(req, res) {
    var SQL = "INSERT INTO devices(nick) VALUE ('" + String(req.query.nickname) + "');";
    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "KCTF2019"
    });
    sqlClient.connect();
    sqlClient.query(SQL);
    sqlClient.end()

    res.render('device', {mode: 1});
});
app.get('/resetDevList', function(req, res) {
    var sqlClient = mysql.createConnection({
        host: '127.0.0.1',
        user: "betaman",
        password: "msms0257",
        database: "KCTF2019"
    });
    sqlClient.connect();
    sqlClient.query("DELETE FROM devices");
    sqlClient.query("ALTER TABLE devices AUTO_INCREMENT=1;");
    sqlClient.end();

    res.render('device', {mode: 2});
});

// server open
app.listen(PORT, function() {
    console.log('===========================================================');
    console.log('\tSparkMakers');
    console.log('\tBareunGyosil service server is working now!');
    console.log('\tversion: '+VERSION);
    console.log('\tserver ip: '+getServerIp()); 
    console.log('\tservice port: '+String(PORT));
    console.log('===========================================================');
});