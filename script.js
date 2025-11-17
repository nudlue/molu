// 1. 설정 변수
// -----------------------------------------------------------------

// 모델 경로
const modelURL = './model/model.json';
const metadataURL = './model/metadata.json';

// 클래스 이름 → 이모지 매핑
const classEmojis = {
    "Doorbell": "🔔",
    "Fire Alarm": "🔥",
    "Baby Crying": "👶",
    "Background Noise": "🔇"
};

// 2. HTML 요소 가져오기
// -----------------------------------------------------------------
const startButton = document.getElementById('start-button');
const emojiDisplay = document.getElementById('emoji-display');
const statusText = document.getElementById('status-text');
const tableDiv = document.getElementById('probability-table');

let model; // 모델 저장 변수

// 3. 버튼 클릭 시 init 실행
startButton.addEventListener('click', init);

// 4. 초기화 코드
// -----------------------------------------------------------------

async function init() {
    startButton.disabled = true;
    startButton.textContent = "모델 로드 중...";

    try {
        // 오디오 모델 로드
        model = await tmAudio.load(modelURL, metadataURL);

        // UI 업데이트
        statusText.textContent = "듣고 있어요...";
        startButton.textContent = "분석 실행 중";

        // 실시간 분류 시작
        model.listen(prediction => {
            updateUI(prediction.scores);
        }, {
            includeSpectrogram: false,
            probabilityThreshold: 0.75,
            invokeTime: 1000 // 1초 간격
        });

    } catch (error) {
        console.error("모델 로드 또는 마이크 접근에 실패했습니다:", error);
        statusText.textContent = "오류 발생 (콘솔 확인)";
        startButton.disabled = false;
        startButton.textContent = "다시 시도";
    }
}

// 5. UI 업데이트 함수
// -----------------------------------------------------------------

function updateUI(scores) {
    let bestClassName = "알 수 없음";
    let bestScore = 0.0;

    let tableHTML = "<table><thead><tr><th>소리</th><th>확률</th></tr></thead><tbody>";

    const classLabels = model.getClassLabels();

    for (let i = 0; i < classLabels.length; i++) {
        const className = classLabels[i];
        const score = scores[i];

        tableHTML += `
            <tr>
                <td>${classEmojis[className] || className}</td>
                <td>${(score * 100).toFixed(1)}%</td>
            </tr>
        `;

        if (score > bestScore) {
            bestScore = score;
            bestClassName = className;
        }
    }

    tableHTML += "</tbody></table>";

    tableDiv.innerHTML = tableHTML;
    emojiDisplay.innerHTML = classEmojis[bestClassName] || "❓";
    statusText.textContent = `${bestClassName} (${(bestScore * 100).toFixed(0)}%)`;
}
