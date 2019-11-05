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

let gameActive = false;
let choices = ["rock", "paper", "scissors"];
let cpuChoice;
let game_msg;
let wins = 0;
let losses = 0;
let draws = 0;

let playerCount = 0;
let connectedCount = 0;

let p1_wins = 0;
let p2_wins = 0;
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

function ConfigureFirebase() {

    connectionsRef.on("value", function (snapshot) {

        connectedCount = snapshot.numChildren();
        $("#connected-count").text(connectedCount);
    })

    connectedRef.on("value", function (snapshot) {
        if (snapshot.val()) {

            let con = connectionsRef.push(true);
            con.onDisconnect().remove();

            database.ref("Room 1").once("value").then(function (roomSnapshot) {
                UpdatePlayerConnections();
            })

        }
    })

    database.ref("Room 1").on("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        if (mode === "online") {
            if (roomSnapshot.playersConnected === 2) {
                SwitchPage("online");
            }
            else {
                SwitchPage("online-entry");
            }
        }

        database.ref("Room 1").set(
            {
                p1_username: roomSnapshot.p1_username,
                p1_status: roomSnapshot.p1_status,
                p1_score: roomSnapshot.p1_score,
                p2_username: roomSnapshot.p2_username,
                p2_status: roomSnapshot.p2_status,
                p2_score: roomSnapshot.p2_score,
                playersConnected: roomSnapshot.playersConnected
            }
        )

        $("#p1_status").text(roomSnapshot.p1_username + " " + roomSnapshot.p1_status);
        $("#p2_status").text(roomSnapshot.p2_username + " " + roomSnapshot.p2_status);
    })
}

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

    $(".home").click(function () {
        SwitchPage("home");
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

    $("#join").click(function () {

        thisPlayer = $("#input-username").val().trim();

        if (!thisPlayer) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {

            database.ref("Room 1").once("value").then(function (snapshot) {

            let roomSnapshot = snapshot.val();

            if (roomSnapshot.playersConnected < 2) {
                switch (roomSnapshot.playersConnected) {
                    case 0:
                        $("#p1").attr("value", "[connected]");
                        $("#p1").attr("name", thisPlayer);

                        database.ref("Room 1").set({
                            p1_status: "[connected]",
                            p1_username: thisPlayer,
                            p1_score: 0,
                            p2_status: "[not connected]",
                            p2_username: "",
                            p2_score: 0,
                            playersConnected: 1
                        });

                        sessionStorage.setItem("player", thisPlayer)

                        break;
                    case 1:
                        $("#p2").attr("value", "[connected]");
                        $("#p2").attr("name", thisPlayer);

                            database.ref("Room 1").set({
                                p1_status: roomSnapshot.p1_status,
                                p1_username: roomSnapshot.p1_username,
                                p1_score: roomSnapshot.p1_score,
                                p2_status: $("#p2").attr("value"),
                                p2_username: thisPlayer,
                                p2_score: 0,
                                playersConnected: 2
                            });

                        sessionStorage.setItem("player", thisPlayer);

                        break;
                }
            }
            else { }
        });

            $(this).attr("disabled", true);
        }

    })

    $("#leave").click(function () {
        UpdatePlayerConnections();
        $("#join").attr("disabled", false);
    })

    $("#reset").click(function () {
        ResetFirebase();
    })

}

function ResetSoloGame() {
    gameActive = true;
    cpuChoice = choices[Math.floor(Math.random() * 3)];

    console.log("CPU: " + cpuChoice);

    game_msg = "Make Your Move!";
    UpdateScore();
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
            $("#win").text(p1_wins);
            $("#loss").text(p2_wins);
            $("#draw").text("N/A");
            break;

        default:
            break;
    }
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

function ResetFirebase() {

    database.ref("Room 1").set({
        p1_username: "",
        p1_status: "[not connected]",
        p1_score: 0,
        p2_username: "",
        p2_status: "[not connected]",
        p2_score: 0,
        playersConnected: 0
    })

}

function ClearSessionStorage() {
    sessionStorage.clear();
}

function UpdatePlayerConnections() {

    thisPlayer = sessionStorage.getItem("player");

    database.ref("Room 1").once("value").then(function (snapshot) {

        let roomSnapshot = snapshot.val();

        if (thisPlayer !== "") {

            switch (thisPlayer) {
                case roomSnapshot.p1_username:
                    $("#p1").attr("value", roomSnapshot.p2_status);
                    $("#p1").attr("name", roomSnapshot.p2_username);
                    $("#p2").attr("value", "[not connected]");
                    $("#p2").attr("name", "");

                    let remainingPlayers = 1;

                    if (roomSnapshot.playersConnected === 1)
                        remainingPlayers = 0;

                    database.ref("Room 1").set({
                        p1_status: $("#p1").attr("value"),
                        p1_username: $("#p1").attr("name"),
                        p1_score: roomSnapshot.p2_score,
                        p2_status: $("#p2").attr("value"),
                        p2_username: $("#p2").attr("name"),
                        p2_score: 0,
                        playersConnected: remainingPlayers
                    })
                    break;
                case roomSnapshot.p2_username:
                    $("#p2").attr("value", "[not connected]");
                    $("#p2").attr("name", "");

                    database.ref("Room 1").set({
                        p1_status: roomSnapshot.p1_status,
                        p1_username: roomSnapshot.p1_username,
                        p1_score: roomSnapshot.p1_score,
                        p2_status: $("#p2").attr("value"),
                        p2_username: $("#p2").attr("name"),
                        p2_score: 0,
                        playersConnected: 1
                    })
                    break;
            }
            sessionStorage.removeItem("player");
            thisPlayer = "";
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