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

let gameActive = false;
let choices = ["rock", "paper", "scissors"];
let cpuChoice;
let game_msg;
let wins = 0;
let losses = 0;
let draws = 0;

let mode;
let thisPlayer;

$(document).ready(function () {

    // ClearSessionStorage();
    SwitchPage("home");
    ConfigureButtons();
    ConfigureFirebase();

    $("#p1").attr("name", "");
    $("#p2").attr("name", "");

})


function ConfigureButtons() {
    $("#mode-solo").click(function () {
        mode = "solo";
        SwitchPage("solo");
        ResetSoloGame();
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
                    UpdateOnlineMatch($(this).val());
                    break;
            }
        }
    })

    $("#rematch-btn").click(function () {
        ResetSoloGame();
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

            if (roomSnapshot.playersConnected < 2) {
                switch (roomSnapshot.playersConnected) {
                    case 0:
                        room1Ref.set({
                            p1: {
                                username: thisPlayer,
                                status: "[connected]",
                                move: "",
                                score: 0 },
                            p2 : {
                                username: "",
                                status: "[not connected]",
                                move: "",
                                score: 0
                            },
                            playersConnected: 1
                        });

                        sessionStorage.setItem("player", thisPlayer)

                        break;
                    case 1:
                            room1Ref.set({
                                p1: {
                                    username: roomSnapshot.p1.username,
                                    status: roomSnapshot.p1.status,
                                    move: roomSnapshot.p1.move,
                                    score: roomSnapshot.p1.score
                                },
                                p2: {
                                    username: thisPlayer,
                                    status: "[connected]",
                                    move: "",
                                    score: 0
                                },
                                playersConnected: 2
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
                SwitchPage("home");
                break;
            case "online":
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
                UpdatePlayerConnections();
            })

        }
    })

    database.ref("Room 1/playersConnected").on("value", function(snapshot)
    {
        let playersConnected = snapshot.val();

        if (mode === "online") {
            if (playersConnected === 2) {
                StartOnlineMatch();
            }
            else {
                SwitchPage("online-entry");
            }
        }
    })

    room1Ref.on("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        room1Ref.set(
            {
                p1: {
                    username: roomSnapshot.p1.username,
                    status: roomSnapshot.p1.status,
                    move: roomSnapshot.p1.move,
                    score: roomSnapshot.p1.score
                },
                p2: {
                    username: roomSnapshot.p2.username,
                    status: roomSnapshot.p2.status,
                    move: roomSnapshot.p2.move,
                    score: roomSnapshot.p2.score,
                },
                playersConnected: roomSnapshot.playersConnected
            }
        )

        $("#p1_status").text(roomSnapshot.p1.username + " " + roomSnapshot.p1.status);
        $("#p2_status").text(roomSnapshot.p2.username + " " + roomSnapshot.p2.status);
    })
}

function ResetFirebase() {

    room1Ref.set({
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
        },
        playersConnected: 0
    })

}

function EvaluateRound(pChoice) {
    //   Returns true if "pChoice" wins against "cpuChoice"
    //   Returns false if "cpuChoice" wins against "pChoice"

    console.log("PLAYER: " + pChoice);

    let result;

    switch (pChoice) {
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

function ResetSoloGame() {
    gameActive = true;
    cpuChoice = choices[Math.floor(Math.random() * 3)];

    console.log("CPU: " + cpuChoice);

    game_msg = "Make Your Move!";
    UpdateScore();
}

function ClearSessionStorage() {
    sessionStorage.clear();
}

function UpdateScore() {

    switch (mode) {
        case "solo":
            $("#game-msg").text(game_msg);
            $("#win").text(wins);
            $("#loss").text(losses);
            $("#draw").text(draws);
            break;

        case "online":
            $("#game-msg").text(game_msg);
            $("#win").text(wins);
            $("#loss").text(wins);
            $("#draw").text("N/A");
            break;

        default:
            break;
    }
}

function StartOnlineMatch() {
    gameActive = true;
    SwitchPage("online");
}

function UpdateOnlineMatch(playerMove) {

    thisPlayer = sessionStorage.getItem("player");

    room1Ref.once("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        switch (thisPlayer) {
            case roomSnapshot.p1.username:
                room1Ref.set({
                    p1: {
                        username: roomSnapshot.p1.username,
                        status: roomSnapshot.p1.status,
                        move: playerMove,
                        score: roomSnapshot.p1.score
                    },
                    p2: {
                        username: roomSnapshot.p2.username,
                        status: roomSnapshot.p2.status,
                        move: roomSnapshot.p2.move,
                        score: roomSnapshot.p2.score
                    },
                    playersConnected: roomSnapshot.playersConnected
                });
                break;
            case roomSnapshot.p2.username:
                    room1Ref.set({
                        p1: {
                            username: roomSnapshot.p1.username,
                            status: roomSnapshot.p1.status,
                            move: roomSnapshot.p1.move,
                            score: roomSnapshot.p1.score
                        },
                        p2: {
                            username: roomSnapshot.p2.username,
                            status: roomSnapshot.p2.status,
                            move: playerMove,
                            score: roomSnapshot.p2.score
                        },
                        playersConnected: roomSnapshot.playersConnected
                    });
                break;
        }
    })

}

function UpdatePlayerConnections() {

    thisPlayer = sessionStorage.getItem("player");

    room1Ref.once("value").then(function (snapshot) {

        let roomSnapshot = snapshot.val();

        if (thisPlayer !== "") {

            switch (thisPlayer) {
                case roomSnapshot.p1.username:
                    let remainingPlayers = 1;

                    if (roomSnapshot.playersConnected === 1)
                        remainingPlayers = 0;

                    room1Ref.set({
                        p1: {
                            username: roomSnapshot.p2.username,
                            status: roomSnapshot.p2.status,
                            move: roomSnapshot.p2.move,
                            score: roomSnapshot.p2.score
                        },
                        p2: {
                            username: "",
                            status: "[not connected]",
                            move: "",
                            score: 0,
                        },
                        playersConnected: remainingPlayers
                    })
                    break;
                case roomSnapshot.p2.username:
                    room1Ref.set({
                        p1: {
                            username: roomSnapshot.p1.username,
                            status: roomSnapshot.p1.status,
                            move: roomSnapshot.p1.move,
                            score: roomSnapshot.p1.score
                        },
                        p2: {
                            username: "",
                            status: "[not connected]",
                            move: "",
                            score: 0
                        },
                        playersConnected: 1
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