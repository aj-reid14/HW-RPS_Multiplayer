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
let database = firebase.database();
let connectionsRef = database.ref("/connections");
let connectedRef = database.ref(".info/connected");
let room1Ref = database.ref("Room 1");
let room1Ref_players = database.ref("Room 1/players");
let room1Ref_gameInfo = database.ref("Room 1/gameInfo");

let gameActive = false;
let choices = ["rock", "paper", "scissors"];
let cpuChoice;
let game_msg;
let wins = 0;
let losses = 0;
let draws = 0;

let mode;
let thisPlayer;
let p1Move = "";
let p2Move = "";
let currP1Score = 0;
let currP2Score = 0;

$(document).ready(function () {

    SwitchPage("home");
    ConfigureButtons();
    ConfigureFirebase();

    $("#p1").attr("name", "");
    $("#p2").attr("name", "");

})

function ConfigureButtons() {
    $("#mode-solo").click(function () {
        mode = "solo";
        ResetSoloGame();
        SwitchPage("solo");
        gameActive = true;
    })

    $("#mode-online").click(function () {
        mode = "online";
        SwitchPage("online-entry");
    })

    $(document.body).on("click", ".play-btn", function () {
        if (gameActive) {
            switch (mode) {
                case "solo":
                    let playerChoice = $(this).val();
                    EvaluateRound(playerChoice);
                    break;
                case "online":
                    $(this).css("border-color", "green")
                    UpdateOnlineMatch($(this).val());
                    break;
            }
        }
    })

    $(".rematch").click(function () {

        switch (mode) {
            case "solo":
                gameActive = true;
                ResetSoloGame();
                break;

            case "online":
                gameActive = true;
                RestartOnlineMatch();
                break;
        }
    })

    $("#join").click(function () {

        thisPlayer = $("#input-username").val().trim();

        if (!thisPlayer) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {

            room1Ref.once("value").then(function (snapshot) {

            let roomSnapshot = snapshot.val();

            if (roomSnapshot.gameInfo.playersConnected < 2) {
                switch (roomSnapshot.gameInfo.playersConnected) {
                    case 0:
                        room1Ref.set({
                            players: {
                                p1: {
                                    username: thisPlayer,
                                    status: "[connected]",
                                    move: "",
                                    score: 0
                                },
                                p2: {
                                    username: "",
                                    status: "[not connected]",
                                    move: "",
                                    score: 0
                                }
                            },
                            gameInfo: {
                            playersConnected: 1,
                            gameMessage: ""
                            }
                        });

                        sessionStorage.setItem("player", thisPlayer)

                        break;
                    case 1:                        
                            room1Ref.set({
                                players: {
                                p1: {
                                    username: roomSnapshot.players.p1.username,
                                    status: roomSnapshot.players.p1.status,
                                    move: roomSnapshot.players.p1.move,
                                    score: roomSnapshot.players.p1.score
                                },
                                p2: {
                                    username: thisPlayer,
                                    status: "[connected]",
                                    move: "",
                                    score: 0
                                }
                            },
                            gameInfo: {
                                playersConnected: 2,
                                gameMessage: "Make Your Moves!"
                            }
                            });

                        sessionStorage.setItem("player", thisPlayer);

                        break;
                }
            }
            else { }
        });

            $(this).attr("disabled", true);
            $("#input-username").attr("disabled", true);
        }

    })

    $(".leave").click(function () {

        switch (mode) {
            case "solo":
                wins = 0;
                losses = 0;
                draws = 0;
                SwitchPage("home");
                $(".game-msg").text("");
                break;
            case "online":

                // -------------------------------------------------
                // Temporary while disconnected from the Internet
                SwitchPage("home");
                // -------------------------------------------------

                UpdatePlayerConnections();
                $("#join").attr("disabled", false);
                $("#input-username").attr("disabled", false);
                $("#input-username").val("");
                break;
        }
    })

    $("#reset").click(function () {
        ResetFirebase();
    })

}

function ConfigureFirebase() {

    connectedRef.on("value", function (snapshot) {
        if (snapshot.val()) {

            let con = connectionsRef.push(true);
            con.onDisconnect().remove();

            room1Ref.once("value").then(function (roomSnapshot) {
                roomSnapshot = roomSnapshot.val();
                if (roomSnapshot.gameInfo.playersConnected === 0)
                    ResetFirebase();
                else
                    UpdatePlayerConnections();
            })

        }
    })

    room1Ref_gameInfo.on("value", function(snapshot) {
        let roomInfo = snapshot.val();

        $(".game-msg").text(roomInfo.gameMessage);

        if (mode === "online") {
            if (roomInfo.playersConnected === 2) {
                StartOnlineMatch();
            }
            else {
                gameActive = false;
                $(".play-btn").attr("disabled", false);
                SwitchPage("online-entry");
            }
        }
    })

    room1Ref_players.on("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        if (roomSnapshot.p1.move)
            $("#p1-username").css("color", "green");
        else
            $("#p1-username").css("color", "black");

        if (roomSnapshot.p2.move)
            $("#p2-username").css("color", "green");
        else
            $("#p2-username").css("color", "black");

        if (gameActive && roomSnapshot.p1.move && roomSnapshot.p2.move) {
            $("#rematch-online").show();
            EvaluateRound(roomSnapshot.p1.move, roomSnapshot.p2.move);
        }

        if (roomSnapshot.p1.move === "rematch" && roomSnapshot.p2.move === "rematch") {
            $("#rematch-online").hide();
            $(".play-btn").attr("disabled", false);
            $(".play-btn").css("border-color", "darkred");
        }

        $("#p1_status").text(roomSnapshot.p1.username + " " + roomSnapshot.p1.status);
        $("#p2_status").text(roomSnapshot.p2.username + " " + roomSnapshot.p2.status);

        if (roomSnapshot.p1.status === "[connected]")
            $("#p1_status").css("color", "darkgreen");
        else
            $("#p1_status").css("color", "black");

        if (roomSnapshot.p2.status === "[connected]")
            $("#p2_status").css("color", "darkgreen");
        else
            $("#p2_status").css("color", "black");

        $("#p1-score").text(roomSnapshot.p1.score);
        $("#p2-score").text(roomSnapshot.p2.score);
    })
}

function ResetFirebase() {

    room1Ref.set({
        players: {
            p1: {
                username: "",
                status: "[not connected]",
                move: "",
                score: 0,
            },
            p2: {
                username: "",
                status: "[not connected]",
                move: "",
                score: 0,
            }
        },
        gameInfo: {
            playersConnected: 0,
            gameMessage: ""
        }
    })

}

function ResetSoloGame() {
    $("#rematch-solo").hide();
    cpuChoice = choices[Math.floor(Math.random() * 3)];
    console.log("CPU: " + cpuChoice);
    game_msg = "Make Your Move Against the CPU!";
    UpdateScore();
}

function ClearSessionStorage() {
    sessionStorage.clear();
}

function UpdateScore() {

    switch (mode) {
        case "solo":
            $(".game-msg").text(game_msg);
            $("#win").text(wins);
            $("#loss").text(losses);
            $("#draw").text(draws);
            break;
    }
}

function StartOnlineMatch() {

    gameActive = true;

    room1Ref.once("value", function(snapshot) {
        let roomSnapshot = snapshot.val();

        $("#p1-username").text(roomSnapshot.players.p1.username);
        $("#p2-username").text(roomSnapshot.players.p2.username);
        $("#p1-score").text(roomSnapshot.players.p1.score);
        $("#p2-score").text(roomSnapshot.players.p2.score);
    })

    SwitchPage("online");
}

function UpdateOnlineMatch(playerMove) {

    thisPlayer = sessionStorage.getItem("player");
    $(".play-btn").attr("disabled", true);

    room1Ref_players.once("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        switch (thisPlayer) {
            case roomSnapshot.p1.username:
                database.ref("Room 1/players/p1/move").set(playerMove);
                break;
            case roomSnapshot.p2.username:
                database.ref("Room 1/players/p2/move").set(playerMove);
                break;
        }
    })

}

function RestartOnlineMatch() {

    let playersReady = false;
    thisPlayer = sessionStorage.getItem("player");

    room1Ref.once("value", function (snapshot) {

        let roomSnapshot = snapshot.val();

        switch (thisPlayer) {
            case roomSnapshot.players.p1.username:
                database.ref("Room 1/players/p1/move").set("rematch");

                if (roomSnapshot.players.p2.move !== "rematch")
                    database.ref("Room 1/gameInfo/gameMessage").set("Rematch! Waiting for " + roomSnapshot.players.p2.username + "...");
                else {
                    playersReady = true;
                    database.ref("Room 1/gameInfo/gameMessage").set("Make Your Moves!");
                }
                break;
            case roomSnapshot.players.p2.username:
                database.ref("Room 1/players/p2/move").set("rematch");

                if (roomSnapshot.players.p1.move !== "rematch")
                    database.ref("Room 1/gameInfo/gameMessage").set("Rematch! Waiting for " + roomSnapshot.players.p1.username + "...");
                else {
                    playersReady = true;
                    database.ref("Room 1/gameInfo/gameMessage").set("Make Your Moves!");
                }
                break;
        }

        if (playersReady) {
            // Restart Match
            database.ref("Room 1/players/p1/move").set("");
            database.ref("Room 1/players/p2/move").set("");
        }

    })

}

function EvaluateRound(p1_move, p2_move) {

    if (mode === "solo") {
        p2_move = cpuChoice;
        console.log("PLAYER: " + p1_move);

        switch (p1_move) {
            case "rock":
                switch (p2_move) {
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
                switch (p2_move) {
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
                switch (p2_move) {
                    case "rock":
                        losses++;
                        game_msg = "You Lose!";
                        break;
                    case "paper":
                        wins++;
                        game_msg = "You Win!";
                        break;
                    case "scissors":
                        draws++;
                        game_msg = "Draw!";
                        break;
                }
                break;
        }

        UpdateScore();
        $("#rematch-solo").show();
        gameActive = false;

    }
    else if (mode === "online") {

        if (gameActive) {

            gameActive = false;

            room1Ref.once("value", function (snapshot) {
                let roomSnapshot = snapshot.val();

                let p1_score = roomSnapshot.players.p1.score;
                let p2_score = roomSnapshot.players.p2.score;
                let roundResult = roomSnapshot.gameInfo.gameMessage;

                switch (p1_move) {
                    case "rock":
                        switch (p2_move) {
                            case "rock":
                                roundResult = "Draw!";
                                break;
                            case "paper":
                                p2_score++;
                                roundResult = roomSnapshot.players.p2.username + " Wins!";
                                break;
                            case "scissors":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                break;
                        }
                        break;

                    case "paper":
                        switch (p2_move) {
                            case "rock":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                break;
                            case "paper":
                                roundResult = "Draw!";
                                break;
                            case "scissors":
                                p2_score++;
                                roundResult = roomSnapshot.players.p2.username + " Wins!";
                                break;
                        }
                        break;

                    case "scissors":
                        switch (p2_move) {
                            case "rock":
                                p2_score++;
                                roundResult = roomSnapshot.players.p2.username + " Wins!";
                                break;
                            case "paper":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                break;
                            case "scissors":
                                roundResult = "Draw!";
                                break;
                        }
                        break;
                }

                database.ref("Room 1/players/p1/score").set(p1_score);
                database.ref("Room 1/players/p2/score").set(p2_score);
                database.ref("Room 1/gameInfo/gameMessage").set(roundResult);
            })
        }
    }
}

function UpdatePlayerConnections() {

    thisPlayer = sessionStorage.getItem("player");

    room1Ref.once("value").then(function (snapshot) {

        let roomSnapshot = snapshot.val();
        let remainingPlayers = 1;

        if (roomSnapshot.gameInfo.playersConnected === 1)
            remainingPlayers = 0;

        if (thisPlayer !== "") {

            gameActive = false;

            switch (thisPlayer) {
                case roomSnapshot.players.p1.username:
                    room1Ref.set({
                        players: {
                        p1: {
                            username: "",
                            status: "[not connected]",
                            move: "",
                            score: 0
                        },
                        p2: {
                            username: roomSnapshot.players.p2.username,
                            status: roomSnapshot.players.p2.status,
                            move: "",
                            score: 0,
                        }
                    },
                    gameInfo: {
                        playersConnected: remainingPlayers,
                        gameMessage: ""
                    }
                    })
                    break;
                case roomSnapshot.players.p2.username:
                    room1Ref.set({
                        players: {
                        p1: {
                            username: roomSnapshot.players.p1.username,
                            status: roomSnapshot.players.p1.status,
                            move: "",
                            score: 0
                        },
                        p2: {
                            username: "",
                            status: "[not connected]",
                            move: "",
                            score: 0
                        }
                    },
                    gameInfo: {
                        playersConnected: remainingPlayers,
                        gameMessage: ""
                    }
                    })
                    break;
            }
            sessionStorage.removeItem("player");
            thisPlayer = "";
            SwitchPage("home");
        }
    })
}

function SwitchPage(page) {
    switch (page) {
        case "home":
            $("#content-menu").css("display", "initial");
            $("#content-solo").css("display", "none");
            $("#content-entry").css("display", "none");
            $("#content-online").css("display", "none");
            break;
        case "solo":
            $("#content-menu").css("display", "none");
            $("#content-solo").css("display", "initial");
            $("#content-online").css("display", "none");
            break;
        case "online-entry":
            $("#content-menu").css("display", "none");
            $("#content-solo").css("display", "none");
            $("#content-entry").css("display", "initial");
            $("#content-online").css("display", "none");
            break;
        case "online":
            $("#content-menu").css("display", "none");
            $("#content-online").css("display", "initial");
            break;
    }
}