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
let onlineMSGS = [];
let playersConnected;
let gameState = {
    p1_username: "",
    p1_status: "",
    p1_score: "",
    p2_username: "",
    p2_status: "",
    p2_score: ""
};

$(document).ready(function () {

    SwitchPage("home");
    ConfigureButtons();
    ConfigureFirebase();

    $("#p1").attr("name", "");
    $("#p2").attr("name", "");

})

function ConfigureFirebase() {

    connectedRef.on("value", function(snapshot) {
        if (snapshot.val())
        {
            let con = connectionsRef.push(true);
            con.onDisconnect().remove();
        }
    })

    database.ref().on("value", function(snapshot)
    {
        sv = snapshot.val();

        playersConnected = 0;

        if (sv["Room 1"].p1_status === "[connected]")
            playersConnected++;

        if (sv["Room 1"].p2_status === "[connected]")
            playersConnected++;

            gameState.p1_username = sv["Room 1"].p1_username;
            gameState.p1_status = sv["Room 1"].p1_status;
            gameState.p1_score = sv["Room 1"].p1_score;
            gameState.p2_username = sv["Room 1"].p2_username;
            gameState.p2_status = sv["Room 1"].p2_status;
            gameState.p2_score = sv["Room 1"].p2_score;

        console.log(gameState);

        database.ref("Room 1/").set(
            {
                // p1_username: $("#p1").attr("name"),
                // p1_status: $("#p1").attr("value"),
                // p1_score: p1_wins,
                // p2_username: $("#p2").attr("name"),
                // p2_status: $("#p2").attr("value"),
                // p2_score: p2_wins,
                // playersConnected: playersConnected

                p1_username: gameState.p1_username,
                p1_status: gameState.p1_status,
                p1_score: gameState.p1_score,
                p2_username: gameState.p2_username,
                p2_status: gameState.p2_status,
                p2_score: gameState.p2_score,
                playersConnected: playersConnected
            }
        )

        if (sv["Room 1"].p1_status === "[connected]") {
            $("#join-p1").attr("disabled", true);
        }

        if (sv["Room 1"].p2_status === "[connected]") {
            $("#join-p2").attr("disabled", true);
        }

        $("#p1_status").text(gameState.p1_username + " " + gameState.p1_status);
        $("#p2_status").text(gameState.p2_username + " " + gameState.p2_status);
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
        OnlinePlay();
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

        let userText = $("#input-username").val().trim();

        if (!userText) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {

            if (playersConnected < 2) {
                switch (playersConnected) {
                    case 0:
                        $("#p1").attr("value", "[connected]");
                        $("#p1").attr("name", userText);

                        database.ref("Room 1").set({
                            p1_status: $("#p1").attr("value"),
                            p1_username: userText,
                            p1_score: 0,
                            p2_status: gameState.p2_status,
                            p2_username: gameState.p2_username,
                            p2_score: gameState.p2_score
                        })
                        break;
                    case 1:
                        $("#p2").attr("value", "[connected]");
                        $("#p2").attr("name", userText);

                        database.ref("Room 1").set({
                            p1_status: gameState.p1_status,
                            p1_username: gameState.p1_username,
                            p1_score: gameState.p1_score,
                            p2_status: $("#p2").attr("value"),
                            p2_username: userText,
                            p2_score: 0,
                        })
                        break;
                }
            }
            else {}
            
            $(this).attr("disabled", true);
        }

    })

    $("#join-p1").click(function() {
        
        let userText = $("#input-username").val().trim();
        
        if (!userText) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {
            
            $("#p1").attr("value", "[connected]");
            $("#p1").attr("name", userText);            

            database.ref("Room 1").set({
                p1_status: $("#p1").attr("value"),
                p1_username: userText,
                p1_score: 0,
                p2_status: gameState.p2_status,
                p2_username: gameState.p2_username,
                p2_score: gameState.p2_score
            })
            
        }

    })

    $("#join-p2").click(function () {

        let userText = $("#input-username").val().trim();

        if (!userText) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {
            
            $("#p2").attr("value", "[connected]");
            $("#p2").attr("name", userText);            

            database.ref("Room 1").set({
                p1_status: gameState.p2_status,
                p1_username: gameState.p2_username,
                p1_score: gameState.p2_score,
                p2_status: $("#p1").attr("value"),
                p2_username: userText,
                p2_score: 0,
            })
            
            $("#p2_status").text(userText + " [connected]");
        }
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

function OnlinePlay() {

    connectionsRef.on("value", function (snapshot) {
        connectedCount = snapshot.numChildren();
        $("#connected-count").text(connectedCount);
    })
}

function UpdateOnlineMSGS() {
    $("#online-text").val(onlineMSGS.join("\n"));
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