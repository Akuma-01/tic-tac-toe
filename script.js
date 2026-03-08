const Gameboard = (function () {
    const board = [
        '', '', '',
        '', '', '',
        '', '', ''
    ];

    const getBoard = () => board;

    function resetBoard() {
        const cells = document.querySelectorAll('.buttons-container div');

        for (let i = 0; i < board.length; i++) {
            board[i] = '';
        }
        cells.forEach(cell => {
            cell.textContent = '';
        });
    }

    function checkWinner() {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];

        for (let i = 0; i < winningConditions.length; i++) {
            const [a, b, c] = winningConditions[i];

            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }

        return null;
    }

    function isBoardFull() {
        return board.every(cell => cell !== '');
    }

    return {
        getBoard,
        resetBoard,
        checkWinner,
        isBoardFull,
    };
})();

const Participants = (function () {
    const participant = [
        { name: 'Player 1', marker: 'X' },
        { name: 'Player 2', marker: 'O' },
    ];

    const getParticipants = () => participant;

    function setPlayer2Name(name) {
        participant[1].name = name;
    }

    return { getParticipants, setPlayer2Name };
})();

const scoreBoard = (function () {
    const playerOneElement = document.querySelector('#player-one-score');
    const drawElement = document.querySelector('#draw-score');
    const playerTwoElement = document.querySelector('#player-two-score');

    let playerOneScore = 0;
    let drawScore = 0;
    let playerTwoScore = 0;

    function updateScore(winner) {
        if (winner === 'X') {
            playerOneScore++;
            playerOneElement.textContent = playerOneScore;
        } else if (winner === 'O') {
            playerTwoScore++;
            playerTwoElement.textContent = playerTwoScore;
        } else if (winner === 'tie') {
            drawScore++;
            drawElement.textContent = drawScore;
        }
    }

    function resetScores() {
        playerOneScore = 0;
        drawScore = 0;
        playerTwoScore = 0;
        playerOneElement.textContent = playerOneScore;
        drawElement.textContent = drawScore;
        playerTwoElement.textContent = playerTwoScore;
    }

    return {
        updateScore,
        resetScores,
    }
})();

const AI = (function () {

    function checkWinnerOnBoard(b) {
        const wins = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const [a, x, c] of wins) {
            if (b[a] && b[a] === b[x] && b[a] === b[c]) return b[a];
        }
        return null;
    }

    function minimax(board, depth, isMaximizing) {
        const winner = checkWinnerOnBoard(board);
        if (winner === 'O') return 10 - depth;
        if (winner === 'X') return depth - 10;
        if (board.every(cell => cell !== '')) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'O';
                    best = Math.max(best, minimax(board, depth + 1, false));
                    board[i] = '';
                }
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < board.length; i++) {
                if (board[i] === '') {
                    board[i] = 'X';
                    best = Math.min(best, minimax(board, depth + 1, true));
                    board[i] = '';
                }
            }
            return best;
        }
    }

    function getBestMove(board) {
        let bestScore = -Infinity;
        let bestMove = -1;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                const score = minimax(board, 0, false);
                board[i] = '';
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = i;
                }
            }
        }
        return bestMove;
    }

    return { getBestMove };
})();

const GameController = (function () {
    const board = Gameboard.getBoard();
    const participants = Participants.getParticipants();

    let currentPlayer;
    let gameState;

    function init() {
        Gameboard.resetBoard();
        currentPlayer = participants[0];
        commentator(`${currentPlayer.name}'s Turn`);
        gameState = 'playing';
    }

    const switchTurn = () => {
        currentPlayer = currentPlayer === participants[0] ? participants[1] : participants[0];
    };

    function resolveMove(idx, cell) {
        board[idx] = currentPlayer.marker;
        cell.textContent = currentPlayer.marker;

        // Pop animation
        cell.classList.remove('pop');
        void cell.offsetWidth;
        cell.classList.add('pop');

        const winner = Gameboard.checkWinner();
        if (winner) {
            scoreBoard.updateScore(winner);
            commentator(`${currentPlayer.name} Won! 🎉`);
            gameState = 'not_playing';
        } else if (Gameboard.isBoardFull()) {
            scoreBoard.updateScore('tie');
            gameState = 'not_playing';
            commentator(`It's a Tie!`);
        } else {
            switchTurn();
            commentator(`${currentPlayer.name}'s Turn`);

            // CHANGED: only trigger AI if mode is pva AND it's O's turn
            if (ModeManager.isAIMode() && currentPlayer.marker === 'O' && gameState === 'playing') {
                triggerAIMove();
            }
        }
    }

    function triggerAIMove() {
        gameState = 'ai_thinking';
        commentator(`AI is thinking...`);

        setTimeout(() => {
            if (gameState !== 'ai_thinking') return;
            gameState = 'playing';

            const bestIdx = AI.getBestMove(board);
            if (bestIdx === -1) return;

            const cells = document.querySelectorAll('.buttons-container div');
            resolveMove(bestIdx, cells[bestIdx]);
        }, 400);
    }

    function currentTurn(idx, cell) {
        // In PvA mode, block clicks when it's the AI's turn or AI is thinking
        const isAITurn = ModeManager.isAIMode() && currentPlayer.marker === 'O';

        if (board[idx] === '' && gameState === 'playing' && !isAITurn) {
            resolveMove(idx, cell);
        }
    }

    function commentator(message) {
        document.querySelector('#commentator').textContent = message;
    }
    return {
        currentTurn,
        init,
    }
})();

const ModeManager = (function () {
    const overlay = document.querySelector('#mode-select');
    const btnPvP = document.querySelector('#btn-pvp');
    const btnPvA = document.querySelector('#btn-pva');
    const btnChangeMode = document.querySelector('#change-mode');
    const player2Label = document.querySelector('#player-two-label');

    let currentMode = null; // 'pvp' or 'pva'

    function show() {
        overlay.classList.remove('hidden');
    }

    function hide() {
        overlay.classList.add('hidden');
    }

    function setMode(mode) {
        currentMode = mode;

        if (mode === 'pva') {
            Participants.setPlayer2Name('AI');
            player2Label.textContent = 'AI';
        } else {
            Participants.setPlayer2Name('Player 2');
            player2Label.textContent = 'PLAYER 2';
        }

        hide();
        scoreBoard.resetScores();
        GameController.init();
    }

    function isAIMode() {
        return currentMode === 'pva';
    }

    // Button listeners
    btnPvP.addEventListener('click', () => setMode('pvp'));
    btnPvA.addEventListener('click', () => setMode('pva'));
    btnChangeMode.addEventListener('click', show);

    return { show, isAIMode };
})();


(function Actions() {
    const btnsContainer = document.querySelector('.buttons-container');
    const btnResetBoard = document.querySelector('#reset-board');
    const btnResetScores = document.querySelector('#reset-scores');

    btnsContainer.addEventListener('click', function (event) {
        const cell = event.target;
        const idx = cell.getAttribute('data-index');

        if (idx !== null) {
            GameController.currentTurn(Number(idx), cell);
        }
    });

    btnResetBoard.addEventListener('click', GameController.init);
    btnResetScores.addEventListener('click', scoreBoard.resetScores);
})();

ModeManager.show();
