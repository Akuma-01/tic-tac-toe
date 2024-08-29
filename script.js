const gameBoard = ( function() {
    const board = [];

    for (let i = 0; i < 9; i++)
    {
        board[i].push("");
    }

    const getBoard = () => board;

    function resetBoard() {
        const cells = document.querySelectorAll('.buttons-container div')
        for (let i = 0; i < board.length; i++)
        {
            board[i] = "";
        }

        board.forEach(cell => {
            cell.textContent="";
        });
    }

    function checkWinner() {
        const winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let i = 0; i < winningConditions.length; i++)
        {
            const [a, b, c] = winningConditions[i];

            if (board[a] && board[a] === board[b] && board[a] === board[c])
            {
                return board[a];
            }
        }

        return null;                
    }

    function isBoardFull()
    {
        return board.every(cell => cell != '')
    }

    return {
        getBoard,
        resetBoard,
        checkWinner,
        isBoardFull,
    };
})();

const Participants = (function() {
    const participant = [
        {name: 'Player 1', marker:'X'},
        {name: 'Player 2', marker: 'O'},
    ];

    const getParticipants = () => participant;

    return {
        getParticipants,
    }
})();

const scoreBoard = (function() {
    const playerOneElement = document.getElementById('player-one-score');
    const playerTwoElement = document.getElementById('player-two-score');
    const drawElement = document.getElementById('draw-score');

    let playerOneScore = 0;
    let playerTwoScore = 0;
    let drawScore = 0;

    // Some tinkering

    const updateScore = (winner) => {
        if (winner === 'X')
        {
            playerOneScore++;
            playerOneElement.textContent = playerOneScore;
        }
        else if (winner === 'O')
        {
            playerTwoScore++;
            playerTwoElement.textContent = playerTwoScore;
        }
        else if (winner === 'tie')
        {
            drawScore++;
            drawElement.textContent = drawScore;
        }
    };

    const resetScore = () => {
        playerOneScore = 0;
        playerTwoScore = 0;
        drawScore = 0;
        playerOneElement.textContent = playerOneScore;
        playerTwoElement.textContent = playerTwoScore;
        drawElement.textContent = drawScore;
    };

    return {
        updateScore,
        resetScore,
    }
})();

const gameController = ( function() {
    const board = gameBoard.getBoard;
    const participants = Participants.getParticipants;

    let currentPlayer;
    let gameState;

    function init() {
        gameBoard.resetBoard;
        currentPlayer = participants[0];
        commentator(`${currentPlayer.name}'s Turn!`);
        gameState = 'playing';
    }

    function switchTurn() {
        currentPlayer = currentPlayer === participants[0] ? participants[1] : participants[0];
    }

    function currentTurn(idx, cell) {
        if (gameState === 'playing' && board[idx] === '')
        {
            board[idx] = currentPlayer.marker;
            cell.textContent = board[idx];

            const winner = gameBoard.checkWinner();
            if(winner) {
                scoreBoard.updateScore(winner);
                commentator(`${currentPlayer.name}Won!`);
                gameState = 'not_playing';
            }
            else if(gameBoard.isBoardFull)
            {
                scoreBoard.updateScore('tie');
                commentator(`It's a Tie!`);
                gameState = 'not_playing';
            }
            else
            {
                switchTurn();
                commentator(`${currentPlayer.name}'s Turn`);
            }
        }
    }

    function commentator(message) {
        const p = document.querySelector("#commentator");
        p.textContent = `${message}`;
    }

    return {
        init,
        currentTurn,
    }
})();

(function Actions() {
    const btnsContainer = document.querySelector('.buttons-container');
    const btnResetBoard = document.querySelector('#reset-board');
    const btnResetScores = document.querySelector('#reset-scores');

    btnsContainer.addEventListener('click', (event) => {
        const cell = event.target;
        const idx = cell.getAttribute('data-index');

        if (idx != null)
        {
            gameController.currentTurn(idx, cell);
        }
    });

    btnResetBoard.addEventListener('click', gameController.init);
    btnResetScores.addEventListener('click', scoreBoard.resetScore);
})


gameController.init();