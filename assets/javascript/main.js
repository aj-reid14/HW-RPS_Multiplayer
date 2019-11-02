let mode;

var firebaseConfig = {
    apiKey: "AIzaSyA6pCTHavcLWKgngWrzWBOLcUXTveCDD9Y",
    authDomain: "rps-multiplayer-7d6d7.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-7d6d7.firebaseio.com",
    projectId: "rps-multiplayer-7d6d7",
    storageBucket: "rps-multiplayer-7d6d7.appspot.com",
    messagingSenderId: "337347504629",
    appId: "1:337347504629:web:7707bf3251b547a3b758bc"
};

firebase.initializeApp(firebaseConfig);

$(document).ready(function () {
    $("#content-game").css("display", "none");
    ConfigureButtons();
})

function ConfigureButtons() {
    $("#mode-solo").click(function () {
        mode = "solo";

        $("#content-menu").css("display", "none");
        $("#content-game").css("display", "initial");

        ResetSoloGame();
    })

    $("#mode-online").click(function () {
        mode = "online";

        $("#content-menu").css("display", "none");
        $("#content-game").css("display", "initial");
    })

    $("#home-btn").click(function () {
        $("#content-game").css("display", "none");
        $("#content-menu").css("display", "initial");
    })

    $(document.body).on("click", ".play-btn", function () {
        if (gameActive) {
            if (mode === "solo") {
                let playerChoice = $(this).val();
                EvaluateRound(playerChoice);
            }
        }
    })

    $("#rematch-btn").click(function () {
        ResetSoloGame();
    })
}

let gameActive = false;
let choices = ["rock", "paper", "scissors"];
let cpuChoice;
let game_msg;
let wins = 0;
let losses = 0;
let draws = 0;

function ResetSoloGame() {
    gameActive = true;
    cpuChoice = choices[Math.floor(Math.random() * 3)];

    console.log("CPU: " + cpuChoice);

    game_msg = "Make Your Move!";
    UpdateScore();
}

function UpdateScore() {
    $("#game-msg").text(game_msg);
    $("#win").text(wins);
    $("#loss").text(losses);
    $("#draw").text(draws);
}

function EvaluateRound(choice1) {
    //   Returns true if "choice1" wins against "cpuChoice"
    //   Returns false if "cpuChoice" wins against "choice1"

    console.log("PLAYER: " + choice1);

    let result;

    switch (choice1) {
        case "rock":
            switch (cpuChoice) {
                case "rock":
                    draws++;
                    game_msg = "Draw!";
                    break;
                case "paper":
                    losses++;
                    game_msg = "You Lose!";
                    break;
                case "scissors":
                    wins++;
                    game_msg = "You Win!";
                    break;
            }
            break;

        case "paper":
            switch (cpuChoice) {
                case "rock":
                    wins++;
                    game_msg = "You Win!";
                    break;
                case "paper":
                    draws++;
                    game_msg = "Draw!";
                    break;
                case "scissors":
                    losses++;
                    game_msg = "You Lose!";
                    break;
            }
            break;

        case "scissors":
            switch (cpuChoice) {
                case "rock":
                    losses++;
                    game_msg = "You Lose!";
                    break;
                case "paper":
                    wins++;
                    game_msg = "You Win!";
                    break;
                case "scissors":
                    draw++;
                    game_msg = "Draw!";
                    break;
            }
            break;
    }

    UpdateScore();
    gameActive = false;

}
