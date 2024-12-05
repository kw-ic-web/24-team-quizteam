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
    console.log("Requested collection:", collection); // 디버깅 로그

    if (!collection || !collection.startsWith('game_')) {
        console.error("Invalid collection name:", collection);
        return res.status(400).json({ message: "Invalid collection name" });
    }

    try {
        const questions = await getQuestions(collection);
        if (!questions.length) {
            console.warn("No questions found for collection:", collection);
            return res.status(404).json({ message: "No questions found" });
        }
        res.json(questions);
    } catch (error) {
        console.error("Error fetching questions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});



module.exports = router;
