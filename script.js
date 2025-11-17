// 1. 설정 변수
// -----------------------------------------------------------------

// ⚠️ 중요: 모델이 저장된 경로
// (index.html 파일 기준으로 'model' 폴더 안에 있어야 함)
const modelURL = './model/model.json';
const metadataURL = './model/metadata.json';

// ⚠️ 중요: 모델의 클래스 이름과 표시할 이모지를 짝지어주세요.
// Teachable Machine에서 설정한 클래스 이름과 정확히 일치해야 합니다.
const classEmojis = {
    "Doorbell": "🔔",
    "Fire Alarm": "🔥",
    "Baby Crying": "👶",
    "Background Noise": "🔇"
    // 예: "박수": "👏", "웃음": "😂"
};

// 2. HTML 요소 가져오기
// -----------------------------------------------------------------
const startButton = document.getElementById('start-button');
const emojiDisplay = document.getElementById('emoji-display');
const statusText = document.getElementById('status-text');
const tableDiv = document.getElementById('probability-table');

let model; // 로드된 모델을 저장할 변수

// 3. 이벤트 리스너 설정
// -----------------------------------------------------------------
startButton.addEventListener('click', init);

// 4. 핵심 기능: 초기화 및 모델 실행
// -----------------------------------------------------------------

/**
 * 모델 로드 및 마이크 스트리밍 시작
 */
async function init() {
    // UI 업데이트: 로딩 중
    startButton.disabled = true;
    startButton.textContent = "모델 로드 중...";
    
    try {
        // Teachable Machine 오디오 모델 로드
        model = await tmAudio.load(modelURL, metadataURL);
        
        // UI 업데이트: 준비 완료
        statusText.textContent = "듣고 있어요...";
        startButton.textContent = "분석 실행 중";
        
        // 모델의 `listen` 함수를 사용하여 실시간 분류 시작
        // { invokeTime: 1000 } 옵션으로 콜백 함수가 1000ms (1초)마다 실행되도록 설정
        model.listen(prediction => {
            // 1초마다 이 함수가 호출됩니다.
            updateUI(prediction.scores);
        }, {
            includeSpectrogram: false, // 스펙트로그램은 필요 없음
            probabilityThreshold: 0.75, // 이 값은 크게 중요하지 않음 (어차피 다 받음)
            invokeTime: 1000 // ⭐️ 요청하신 1초 간격 설정!
        });

    } catch (error) {
        console.error("모델 로드 또는 마이크 접근에 실패했습니다:", error);
        statusText.textContent = "오류 발생 (콘솔 확인)";
        startButton.disabled = false;
        startButton.textContent = "다시 시도";
    }
}

/**
 * 예측 결과를 받아 UI(이모지, 확률 표)를 업데이트
 */
function updateUI(scores) {
    let bestClassName = "알 수 없음";
    let bestScore = 0.0;
    
    let tableHTML = "<table><thead><tr><th>소리</th><th>확률</th></tr></thead><tbody>";

    // 모델의 모든 클래스 레이블 가져오기
    const classLabels = model.getClassLabels();
    
    // 모든 클래스를 순회하며 확률 표 생성 및 최고 점수 찾기
    for (let i = 0; i < classLabels.length; i++) {
        const className = classLabels[i];
        const score = scores[i];
        
        // 확률 표 HTML 행 추가
        tableHTML += `
            <tr>
                <td>${classEmojis[className] || className}</td>
                <td>${(score * 100).toFixed(1)}%</td>
            </tr>
        `;
        
        // 최고 점수 클래스 업데이트
        if (score > bestScore) {
            bestScore = score;
            bestClassName = className;
        }
    }
    
    tableHTML += "</tbody></table>";
    
    // HTML 업데이트
    tableDiv.innerHTML = tableHTML;
    emojiDisplay.innerHTML = classEmojis[bestClassName] || "❓";
    statusText.textContent = `${bestClassName} (${(bestScore * 100).toFixed(0)}%)`;
}