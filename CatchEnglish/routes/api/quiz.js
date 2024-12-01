const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// MongoDB에서 질문 데이터를 가져오는 함수
const getQuestions = async (collectionName) => {
    try {
        const questions = await mongoose.connection.db
            .collection(collectionName)
            .find({})
            .toArray();
        return questions;
    } catch (error) {
        console.error("문제 가져오기 에러:", error);
        throw error;
    }
};

// Quiz 질문 가져오기 라우트
router.get('/questions/:collection', async (req, res) => {
    const { collection } = req.params;
    try {
        // 컬렉션 이름이 "game_"으로 시작하는지 확인
        if (!collection.startsWith('game_')) {
            return res.status(400).json({ message: "잘못된 컬렉션 이름입니다." });
        }
        const questions = await getQuestions(collection);
        res.json(questions);
    } catch (error) {
        console.error("문제를 가져오는 중 오류 발생:", error);
        res.status(500).json({ error: "문제를 가져오는 데 실패했습니다." });
    }
});

module.exports = router;
