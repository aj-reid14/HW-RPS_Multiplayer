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
let numIMGs = 0;
let imgInterval;
let imgsFalling = false;

$(document).ready(function () {

    // Start on 'Home' Page
    SwitchPage("home");

    // Configure All Buttons & Firebase Updates
    ConfigureButtons();
    ConfigureFirebase();
})

window.onbeforeunload = function () {

    // Reset online database, only if online game is currently running
    if (mode === "online" && gameActive) {
        this.ResetFirebase();
    }
}

function ConfigureButtons() {
    $("#mode-solo").click(function () {
        // Set 'mode' to Solo and Start a New Solo Game
        mode = "solo";
        ResetSoloGame();
        SwitchPage("solo");
        gameActive = true;
    })

    $("#mode-online").click(function () {
        // Set 'mode' to Online and Switch Page to 'online-entry'
        room1Ref_gameInfo.on("value", function (snapshot) {
            let roomSnapshot = snapshot.val();

            // If 2 players haven't connected yet, show 'online-entry'
            if (roomSnapshot.playersConnected < 2) {
                mode = "online";
                SwitchPage("online-entry");
            } else {
                // If 2 players are already connected, show 'Game in Session'
                $("#menu-msg").text("Game Currently in Session, Try Again Later!");
                setTimeout(function () { $("#menu-msg").text("Select A Mode") }, 3000);
            }
        })
    })

    $(document.body).on("click", ".play-btn", function () {
        if (gameActive) {
            // '.play-btn' should only be available when either Solo or Online game is running
            switch (mode) {
                case "solo":
                    // Evaulate the round based on the Player's Choice and the Random CPU's choice
                    let playerChoice = $(this).val();
                    EvaluateRound(playerChoice);
                    break;
                case "online":
                    // Update Online Match Info (Firebase) when '.play-btn' is pressed during an Online Match
                    $(this).css("border-color", "green");
                    UpdateOnlineMatch($(this).val());
                    break;
            }
        }
    })

    $(".rematch").click(function () {

        switch (mode) {
            case "solo":
                // Start a New Online Game
                gameActive = true;
                ResetSoloGame();
                break;

            case "online":
                // Initiate (or confirm) Rematch Request for Online Match
                gameActive = true;
                RestartOnlineMatch();
                break;
        }
    })

    $("#join").click(function () {

        // Validate Username (no spaces, can't be left empty)
        let invalidUsername = false;
        thisPlayer = $("#input-username").val().trim();

        if (!thisPlayer || (thisPlayer.indexOf(" ") !== -1))
            invalidUsername = true;

        if (invalidUsername) {
            $("#input-username").val("");
            $("#input-username").attr("placeholder", "Invalid Username!");
        }
        else {
            // If username is valid, add player to game and update status
            room1Ref.once("value").then(function (snapshot) {

                let roomSnapshot = snapshot.val();

                // Update 'Player1' or 'Player2' based on how many players
                // are already connected
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

        // If background images are falling when this is clicked,
        // stop the images
        StopFallingIMGs();

        // Depending on the mode, end game and update page accordingly
        switch (mode) {
            case "solo":
                wins = 0;
                losses = 0;
                draws = 0;
                SwitchPage("home");
                $(".game-msg").text("");
                break;
            case "online":
                UpdatePlayerConnections();
                $("#join").attr("disabled", false);
                $("#input-username").attr("disabled", false);
                $("#input-username").attr("placeholder", "Enter a username");
                $("#input-username").val("");
                $(".play-btn").css("border-color", "darkred");
                SwitchPage("home");
                break;
        }
    })

    $("#reset").click(function () {
        // Reset Firebase Database
        ResetFirebase();
    })

}

function ConfigureFirebase() {

    // When a connection changes, (client either connects to page or disconnects)
    connectedRef.on("value", function (snapshot) {
        if (snapshot.val()) {

            // Add new connection to connections list
            let con = connectionsRef.push(true);
            con.onDisconnect().remove();

            // U
            // - If there are currently no players, reset the database
            // - If there are players, update connection (a player has left)
            room1Ref_gameInfo.once("value").then(function (roomSnapshot) {
                roomSnapshot = roomSnapshot.val();
                if (roomSnapshot.playersConnected === 0)
                    ResetFirebase();
                else
                    UpdatePlayerConnections();
            })

        }
    })

    // When the 'gameInfo' (gameMessage or playersConnected) is updated (from any client)
    room1Ref_gameInfo.on("value", function (snapshot) {
        let roomInfo = snapshot.val();


        if (mode === "online") {

            // - Update gameMessage for all connected clients
            // - Start Match once 'playersConnected' is updated to 2
            $(".game-msg").text(roomInfo.gameMessage);
            if (roomInfo.playersConnected === 2) {
                StartOnlineMatch();
            }
            else {
                // - Deactivate the game and reactivate the buttons until game is ready
                gameActive = false;
                $(".play-btn").attr("disabled", false);
            }
        }
    })

    // When 'players' data is updated (from any client)
    room1Ref_players.on("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        // Update P1 & P2 name once they make their moves (for all clients)
        if (roomSnapshot.p1.move)
            $("#p1-username").css("color", "green");
        else
            $("#p1-username").css("color", "black");

        if (roomSnapshot.p2.move)
            $("#p2-username").css("color", "green");
        else
            $("#p2-username").css("color", "black");

        // Once both players have moved, evaluate the round
        if (gameActive && roomSnapshot.p1.move && roomSnapshot.p2.move) {
            $("#rematch-online").show();
            EvaluateRound(roomSnapshot.p1.move, roomSnapshot.p2.move);
        }

        // If both players have requested a rematch, restart the match and re-hide button
        if (roomSnapshot.p1.move === "rematch" && roomSnapshot.p2.move === "rematch") {
            $("#rematch-online").hide();
            $(".play-btn").attr("disabled", false);
            $(".play-btn").css("border-color", "darkred");
        }

        // Update players' connection/game info when data is changed (for all clients)
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

function EvaluateRound(p1_move, p2_move) {

    if (mode === "solo") {

        // Based on the player's choice, decide winner against CPU choice and update
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
                        SetupFallingIMGs(p1_move);
                        break;
                }
                break;

            case "paper":
                switch (p2_move) {
                    case "rock":
                        wins++;
                        game_msg = "You Win!";
                        SetupFallingIMGs(p1_move);
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
                        SetupFallingIMGs(p1_move);
                        break;
                    case "scissors":
                        draws++;
                        game_msg = "Draw!";
                        break;
                }
                break;
        }

        UpdateSoloScore();
        $("#rematch-solo").show();
        gameActive = false;

    }
    else if (mode === "online") {

        if (gameActive) {

            // Decide winner based on each player's move, then update score and database

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
                                SetupFallingIMGs(p2_move);
                                break;
                            case "scissors":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                SetupFallingIMGs(p1_move);
                                break;
                        }
                        break;

                    case "paper":
                        switch (p2_move) {
                            case "rock":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                SetupFallingIMGs(p1_move);
                                break;
                            case "paper":
                                roundResult = "Draw!";
                                break;
                            case "scissors":
                                p2_score++;
                                roundResult = roomSnapshot.players.p2.username + " Wins!";
                                SetupFallingIMGs(p2_move);
                                break;
                        }
                        break;

                    case "scissors":
                        switch (p2_move) {
                            case "rock":
                                p2_score++;
                                roundResult = roomSnapshot.players.p2.username + " Wins!";
                                SetupFallingIMGs(p2_move);
                                break;
                            case "paper":
                                p1_score++;
                                roundResult = roomSnapshot.players.p1.username + " Wins!";
                                SetupFallingIMGs(p1_move);
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

function StartOnlineMatch() {

    // Start new online game with current values from Firebase
    gameActive = true;

    room1Ref.once("value", function (snapshot) {
        let roomSnapshot = snapshot.val();

        $("#p1-username").text(roomSnapshot.players.p1.username);
        $("#p2-username").text(roomSnapshot.players.p2.username);
        $("#p1-score").text(roomSnapshot.players.p1.score);
        $("#p2-score").text(roomSnapshot.players.p2.score);
    })

    SwitchPage("online");
}

function UpdateOnlineMatch(playerMove) {

    // Update database when a player chooses their move

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

function UpdatePlayerConnections() {

    // - If the page is refreshed or "leave" is clicked,
    // - Retrieve player's username from sessionStorage
    // - Remove this player from database and update

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
                    // * If 2 players are connected and player 1 leaves,
                    // * Move player 2 to player 1 slot
                    room1Ref.set({
                        players: {
                            p1: {
                                username: roomSnapshot.players.p2.username,
                                status: roomSnapshot.players.p2.status,
                                move: "",
                                score: 0
                            },
                            p2: {
                                username: "",
                                status: "[not connected]",
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
        }
    })
}

function UpdateSoloScore() {

    // Update page with new score values
    switch (mode) {
        case "solo":
            $(".game-msg").text(game_msg);
            $("#win").text(wins);
            $("#loss").text(losses);
            $("#draw").text(draws);
            break;
    }
}

function ResetSoloGame() {

    // If background images are currently falling, stop the images
    StopFallingIMGs();

    // Reset solo game info and update the score
    $("#rematch-solo").hide();
    cpuChoice = choices[Math.floor(Math.random() * 3)];
    console.log("CPU: " + cpuChoice);
    game_msg = "Make Your Move Against the CPU!";
    UpdateSoloScore();
}

function RestartOnlineMatch() {

    // If background images are currently falling, stop the images
    StopFallingIMGs();

    // - When a player requests a rematch, set their move to 'rematch'
    // - When both players have requested a rematch, restart the match
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
            // Clear moves in preparation for new match
            database.ref("Room 1/players/p1/move").set("");
            database.ref("Room 1/players/p2/move").set("");
        }

    })

}

function ResetFirebase() {

    // Set database values to default

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

function SetupFallingIMGs(winningIMG) {

    // Change background images depending on the winning move (rock, paper, or scissors)
    let imgSrc;

    switch (winningIMG) {
        case "rock":
            imgSrc = "assets/images/rock.png";
            break;
        case "paper":
            imgSrc = "assets/images/paper.png";
            break;
        case "scissors":
            imgSrc = "assets/images/scissors.png";
            break;
    }

    // If no images are already falling, reset image count and start new falling images
    if (numIMGs === 0) {
        numIMGs = parseInt($("#falling-imgs").attr("max"));
        imgInterval = setInterval(ShowFallingIMGs, 500, imgSrc);
    }
}

function ShowFallingIMGs(src) {

    // Stop falling images once max number is depleted
    if (numIMGs === 0) {
        StopFallingIMGs();
    } else {

        // - Create a new <img> with the winning img (src) and apply positions / stylings
        // - Decrement 'numIMGs' for every new img created
        numIMGs--;

        let divWidth = Math.floor($("#falling-imgs").width());
        let maxIMGarea = Math.floor(divWidth * 0.7); // 70% of the target div
        let randSpeed = (Math.floor(Math.random() * 4) + 2) + "s"; // Random animation duration

        // Create unique ID for each img (numIMGs updates for each new IMG created)
        let imgID = "thisGIF" + numIMGs;

        let newGIF = $("<img class='gif'>");
        newGIF.attr("id", imgID);
        newGIF.attr("src", src);
        newGIF.css("position", "fixed");
        newGIF.css("animation-duration", randSpeed);

        $("#falling-imgs").append(newGIF);

        // Generate/Set a random startingX for each new img
        let startingX = parseInt($("#falling-imgs").css("left")) + Math.floor((divWidth - maxIMGarea) / 2);
        let randX = Math.floor(Math.random() * maxIMGarea) + startingX;
        let imgSpeed = 900 * parseInt(newGIF.css("animation-duration").substring(0, newGIF.css("animation-duration").length - 1));
        $("#" + imgID).offset({ top: 0, left: randX });

        // Once created, set each img to 'fadeOut' and be removed after the animation
        setTimeout(function () {
            $("#" + imgID).fadeOut(500, function () { $("#" + imgID).remove(); });
        }, imgSpeed);
    }


}

function StopFallingIMGs() {

    // - Clear interval and empty the target div of any remaining images

    numIMGs = 0;
    $(".gif").fadeOut(500, function () { $("#falling-imgs").empty(); });
    clearInterval(imgInterval);
}

function SwitchPage(page) {

    // - Change page based on passed in 'page'

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

function ClearSessionStorage() {
    sessionStorage.clear();
}