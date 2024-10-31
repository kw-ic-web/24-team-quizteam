var express = require('express');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

/* GET signup page. */
router.get('/signup.html', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../views/signup.html'));
});

/* GET start page. */
router.get('/start.html', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../views/start.html'));
});

/* GET login page. */
router.get('/login.html', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

/* POST signup route - 회원가입 처리 */
router.post('/signup', function(req, res, next) {
    // 회원가입 처리 로직 추가 (예: 데이터베이스에 사용자 정보 저장)
    
    // 회원가입 완료 후 login 페이지로 리다이렉션
    res.redirect('/login.html');
});

/* GET waitingRoom page. */
router.get('/waitingRoom.html', function(req, res, next) {
  res.sendFile(path.join(__dirname, '../views/waitingRoom.html'));
});

router.get('/gameRoom.html', function(req, res, next) {
    res.sendFile(path.join(__dirname, '../views/gameRoom.html'));
});

module.exports = router;
