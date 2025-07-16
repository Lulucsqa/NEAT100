var nextConnectionNo = 1000;
var population;
var speed = 60;

var showBest = true;
var runBest = false;
var humanPlaying = false;

var humanPlayer;

var showBrain = false;
var showBestEachGen = false;
var upToGen = 0;
var genPlayerTemp;

var showNothing = false;

function setup() {
  window.canvas = createCanvas(1280, 720);
  population = new Population(500);
  humanPlayer = new Player();
}

function draw() {
  drawToScreen();
  if (showBestEachGen) {
    showBestPlayersForEachGeneration();
  } else if (humanPlaying) {
    showHumanPlaying();
  } else if (runBest) {
    showBestEverPlayer();
  } else {
    if (!population.done()) {
      population.updateAlive();
    } else {
      population.naturalSelection();
    }
  }
}

function showBestPlayersForEachGeneration() {
  if (!genPlayerTemp.dead) {
    genPlayerTemp.look();
    genPlayerTemp.think();
    genPlayerTemp.update();
    genPlayerTemp.show();
  } else {
    upToGen++;
    if (upToGen >= population.genPlayers.length) {
      upToGen = 0;
      showBestEachGen = false;
    } else {
      genPlayerTemp = population.genPlayers[upToGen].cloneForReplay();
    }
  }
}

function showHumanPlaying() {
  if (!humanPlayer.dead) {
    humanPlayer.look();
    humanPlayer.update();
    humanPlayer.show();
  } else {
    humanPlaying = false;
  }
}

function showBestEverPlayer() {
  if (!population.bestPlayer.dead) {
    population.bestPlayer.look();
    population.bestPlayer.think();
    population.bestPlayer.update();
    population.bestPlayer.show();
  } else {
    runBest = false;
    population.bestPlayer = population.bestPlayer.cloneForReplay();
  }
}

function drawToScreen() {
  if (!showNothing) {
    drawBrain();
    writeInfo();
  }
}

function drawBrain() {
  var startX = 0;
  var startY = 0;
  var w = 0;
  var h = 0;

  if (runBest) {
    population.bestPlayer.brain.drawGenome(startX, startY, w, h);
  } else if (humanPlaying) {
    showBrain = false;
  } else if (showBestEachGen) {
    genPlayerTemp.brain.drawGenome(startX, startY, w, h);
  } else {
    population.players[0].brain.drawGenome(startX, startY, w, h);
  }
}

function writeInfo() {
  fill(200);
  textAlign(LEFT);
  textSize(30);
  if (showBestEachGen) {
    text("Score: " + genPlayerTemp.score, 650, 50);
    text("Gen: " + (genPlayerTemp.gen + 1), 1150, 50);
  } else if (humanPlaying) {
    text("Score: " + humanPlayer.score, 650, 50);
  } else if (runBest) {
    text("Score: " + population.bestPlayer.score, 650, 50);
    text("Gen: " + population.gen, 1150, 50);
  } else {
    if (showBest) {
      text("Score: " + population.players[0].score, 650, 50);
      text("Gen: " + population.gen, 1150, 50);
      text("Species: " + population.species.length, 50, canvas.height / 2 + 300);
      text("Global Best Score: " + population.bestScore, 50, canvas.height / 2 + 200);
    }
  }
}

function keyPressed() {
  switch (key) {
    case ' ':
      showBest = !showBest;
      break;
    case 'B':
      runBest = !runBest;
      break;
    case 'G':
      showBestEachGen = !showBestEachGen;
      upToGen = 0;
      genPlayerTemp = population.genPlayers[upToGen].clone();
      break;
    case 'N':
      showNothing = !showNothing;
      break;
    case 'P':
      humanPlaying = !humanPlaying;
      humanPlayer = new Player();
      break;
  }
  switch (keyCode) {
    case UP_ARROW:
      break;
    case DOWN_ARROW:
      break;
    case LEFT_ARROW:
      break;
    case RIGHT_ARROW:
      if (showBestEachGen) {
        upToGen++;
        if (upToGen >= population.genPlayers.length) {
          showBestEachGen = false;
        } else {
          genPlayerTemp = population.genPlayers[upToGen].cloneForReplay();
        }
      } else if (humanPlaying) {
      }
      break;
  }
}
