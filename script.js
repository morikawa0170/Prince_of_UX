document.addEventListener('DOMContentLoaded', () => {

    // --- DOM要素の取得 ---
    const gameScreen = document.getElementById('game-screen');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const collectedCharsDisplay = document.getElementById('collected-chars-display');
    const nextCharDisplay = document.getElementById('next-char-display');
    const comboDisplay = document.getElementById('combo-display');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const finalScoreDisplay = document.getElementById('final-score');
    const playerTitleDisplay = document.getElementById('player-title');

    // --- ゲーム設定 ---
    const GAME_TIME = 60;
    const CHARS = ['U', 'X', '王', '子'];
    const POINT_SET = 100;
    const FPS = 60;

    // --- ゲーム状態変数 ---
    let score = 0;
    let timeLeft = GAME_TIME;
    let currentSet = new Set();
    let orderedCollectedChars = [];
    let consecutiveComboCount = 0;
    let charCreationInterval = null;
    let moveInterval = null;
    let timerInterval = null;
    let isGameActive = false;

    // --- イベントリスナーの設定 ---
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    /**
     * ゲームを初期化して開始する関数
     */
    function startGame() {
        score = 0;
        timeLeft = GAME_TIME;
        currentSet.clear();
        orderedCollectedChars = [];
        consecutiveComboCount = 0;
        isGameActive = true;

        updateUI();
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        
        const existingChars = document.querySelectorAll('.char');
        existingChars.forEach(char => char.remove());

        charCreationInterval = setInterval(() => {
            createCharacter();
            ensureAllCharsExist();
        }, 1000); 
        
        moveInterval = setInterval(moveCharacters, 1000 / FPS);
        timerInterval = setInterval(updateTimer, 1000);
        ensureAllCharsExist();
    }

    /**
     * タイマーを更新する関数
     */
    function updateTimer() {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
            endGame();
        }
    }

    /**
     * ゲームを終了する関数
     */
    function endGame() {
        isGameActive = false;
        clearInterval(charCreationInterval);
        clearInterval(moveInterval);
        clearInterval(timerInterval);

        const existingChars = document.querySelectorAll('.char');
        existingChars.forEach(char => char.remove());

        finalScoreDisplay.textContent = score;
        playerTitleDisplay.textContent = getPlayerTitle(score);
        gameOverScreen.style.display = 'flex';
    }

    /**
     * ★変更点：スコアに応じた称号を返す関数（新しい基準）
     * @param {number} finalScore - 最終スコア
     * @returns {string} 称号
     */
    function getPlayerTitle(finalScore) {
        if (finalScore <= 2000) return '見習いUX王子';
        if (finalScore <= 3500) return '一人前のUX王子';
        if (finalScore <= 4499) return '凄腕のUX王子';
        if (finalScore <= 4999) return 'カリスマのUX王子';
        return '伝説のUX王子';
    }

    /**
     * 文字を生成する関数
     */
    function createCharacter(specificChar = null) {
        if (!isGameActive) return;
        const char = document.createElement('div');
        char.classList.add('char');
        const charText = specificChar || CHARS[Math.floor(Math.random() * CHARS.length)];
        char.textContent = charText;
        char.dataset.char = charText;
        char.style.left = `${Math.random() * (gameScreen.clientWidth - 40)}px`;
        char.style.top = '-40px';
        const fallDurationInSeconds = 3 + (Math.random() - 0.5); 
        const fallSpeed = gameScreen.clientHeight / (fallDurationInSeconds * FPS);
        char.dataset.speed = fallSpeed;
        char.addEventListener('click', handleCharClick);
        gameScreen.appendChild(char);
    }

    /**
     * 画面上のすべての文字を移動させる関数
     */
    function moveCharacters() {
        if (!isGameActive) return;
        const existingChars = document.querySelectorAll('.char');
        existingChars.forEach(char => {
            const currentTop = parseFloat(char.style.top);
            const speed = parseFloat(char.dataset.speed || 1);
            char.style.top = `${currentTop + speed}px`;
            if (currentTop > gameScreen.clientHeight) {
                char.remove();
            }
        });
    }

    /**
     * 文字がクリックされたときの処理
     */
    function handleCharClick(event) {
        if (!isGameActive) return;
        const clickedChar = event.target;
        const charType = clickedChar.dataset.char;

        if (CHARS.includes(charType) && !currentSet.has(charType)) {
            currentSet.add(charType);
            orderedCollectedChars.push(charType);
            clickedChar.classList.add('char-fade-out');
            clickedChar.removeEventListener('click', handleCharClick);
            setTimeout(() => {
                clickedChar.remove();
                ensureAllCharsExist();
            }, 300);
            checkSetCompletion();
            updateUI();
        }
    }
    
    /**
     * セット完成時にコンボチェーンを判定する関数
     */
    function checkSetCompletion() {
        if (currentSet.size === CHARS.length) {
            let isCombo = true;
            for (let i = 0; i < CHARS.length; i++) {
                if (orderedCollectedChars[i] !== CHARS[i]) {
                    isCombo = false;
                    break;
                }
            }

            if (isCombo) {
                consecutiveComboCount++;
                const multiplier = consecutiveComboCount + 1;
                score += POINT_SET * multiplier;
                comboDisplay.classList.remove('combo-increase');
                void comboDisplay.offsetWidth;
                comboDisplay.classList.add('combo-increase');
            } else {
                consecutiveComboCount = 0;
                score += POINT_SET;
            }

            gameScreen.classList.add('set-complete-flash');
            setTimeout(() => {
                gameScreen.classList.remove('set-complete-flash');
            }, 300);

            currentSet.clear();
            orderedCollectedChars = [];
        }
    }

    /**
     * 画面内に全種類の文字が存在するか確認し、なければ生成する関数
     */
    function ensureAllCharsExist() {
        const existingCharTypes = new Set(
            Array.from(document.querySelectorAll('.char')).map(c => c.dataset.char)
        );
        CHARS.forEach(char => {
            if (!existingCharTypes.has(char)) {
                createCharacter(char);
            }
        });
    }

    /**
     * UI更新処理
     */
    function updateUI() {
        scoreDisplay.textContent = `SCORE: ${score}`;
        timerDisplay.textContent = `TIME: ${timeLeft}`;
        
        let collectedHTML = 'SET: ';
        CHARS.forEach(char => {
            if (currentSet.has(char)) {
                collectedHTML += `<span class="collected">${char}</span> `;
            } else {
                collectedHTML += `<span class="needed">_</span> `;
            }
        });
        collectedCharsDisplay.innerHTML = collectedHTML;

        const nextComboChar = CHARS[orderedCollectedChars.length] || CHARS[0];
        nextCharDisplay.textContent = `NEXT: ${nextComboChar}`;

        const displayMultiplier = consecutiveComboCount > 0 ? consecutiveComboCount + 1 : 1;
        comboDisplay.textContent = `x${displayMultiplier}`;
    }
});