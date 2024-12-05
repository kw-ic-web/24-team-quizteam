const mongoose = require("mongoose");
const { Schema } = mongoose;

const roomSchema = new Schema(
    {
        roomId: { type: String, required: true, unique: true }, 
        title: { type: String, required: true, unique: true },
        gameType: { type: String, required: true }, // 게임 유형
        difficulty: { type: String, required: true }, // 난이도
        participants: [
            {
                userId: { type: String, required: true }, // 사용자 ID
                character: { type: String, default: "A" }, // 캐릭터 정보
            },
        ],
        maxParticipants: { type: Number, default: 4 }, // 최대 참가자 수
    },
    { timestamps: true }
);

// 가상 필드: 방이 가득 찼는지 여부
roomSchema.virtual("isFull").get(function () {
    return this.participants.length >= this.maxParticipants;
});

const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
