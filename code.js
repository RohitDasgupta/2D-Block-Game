var p5Inst = new p5(null, 'sketch');

window.preload = function () {
  //initMobileControls(p5Inst);

  p5Inst._predefinedSpriteAnimations = {};
  p5Inst._pauseSpriteAnimationsByDefault = false;
  var animationListJSON = { "orderedKeys": [], "propsByKey": {} };
  var orderedKeys = animationListJSON.orderedKeys;
  var allAnimationsSingleFrame = false;
  orderedKeys.forEach(function (key) {
    var props = animationListJSON.propsByKey[key];
    var frameCount = allAnimationsSingleFrame ? 1 : props.frameCount;
    var image = loadImage(props.rootRelativePath, function () {
      var spriteSheet = loadSpriteSheet(
        image,
        props.frameSize.x,
        props.frameSize.y,
        // frameCount
      );
      p5Inst._predefinedSpriteAnimations[props.name] = loadAnimation(spriteSheet);
      p5Inst._predefinedSpriteAnimations[props.name].looping = props.looping;
      p5Inst._predefinedSpriteAnimations[props.name].frameDelay = props.frameDelay;
    });
  });

  function wrappedExportedCode(stage) {
    if (stage === 'preload') {
      if (setup !== window.setup) {
        window.setup = setup;
      } else {
        return;
      }
    }
    // -----
    var tile_width = 32;
    var tile_height = 32;

    var map_width = windowWidth;
    var map_height = windowHeight;

    var px = tile_width / 2 + tile_width;
    var py = tile_height / 2;
    var pcolor = "white";
    var grav = tile_width/22.8;
    var blocks = [];
    var xspeed = tile_width/6.5;
    var jumpForce = tile_height/1.40;
    var vAcc = grav;

    var targetSize = 0;
    var targetMax = 15;

    var mouseState;

    var mem;
    var score = 0;
    var default_lifetime;
    var enemies;
    var enemySpeed = 2;

    var target = [random(TILE_SIZE*2,map_width - TILE_SIZE*2), random(TILE_SIZE*2, map_height - TILE_SIZE/2), "blue"];
    var spawner = {};
    var chunks_size = tile_width * 4; //blocks

    var chunks = new Array(round(map_width / chunks_size) + 1);
    var drawnChunks = []

    for (var i = 0; i < chunks.length; i++) {
      chunks[i] = new Array(round(map_height / chunks_size) + 1);
      for (var j = 0; j < chunks[i].length; j++) {
        chunks[i][j] = new Array();
      }
    }

    World.frameRate = 60;
    // noStroke();

    //generate level
    createCanvas(windowWidth, windowHeight);
    //startGame();
    
    var state = "start_screen";
    //console.log(blocks.length);

    function draw() {

      textSize(50);
      textAlign(CENTER, CENTER);

      switch(state){
        case "start_screen":
          background(0);
          text("Collect the blue target!",map_width/2, map_height/2 - 25);

          textSize(30);
          text("Break the blocks with the mouse and run from the ghosts!", map_width/2, map_height/2 + 75);
          text("WASD or Arrow Keys to move, Spacebar to start",map_width/2, map_height/2 + 115);

          textSize(20);
          text("PS: Walljump!", map_width/2, map_height/2 + 170);

          textSize(15);
          text("Made by Rohit Dasgupta",map_width/2, 15);


          if(keyWentDown("space"))state="start_game";

          updateTarget();

        return;

        case "start_game":
          startGame();
          state = "game_in_progress";
        return;
        
        case "game_in_progress":
        break;

        case "game_over":
          background(0);
          text("YOU LOST \nFINAL SCORE: " + score, map_width/2, map_height/2);
          textSize(30);
          text("Press Space to Play Again", map_width/2, map_height/2 + 50 + 40);
	  

          if(keyWentDown("space"))state="start_game";
        return;

      }

      drawnChunks = [];

      if (mouseDown("leftButton") && !(mouseY > map_height) && !(mouseX > map_width)) {
        var current_block = checkPosition(mouseX, mouseY);
        var mouseChunk = chunks[getChunk(mouseX, mouseY).x][getChunk(mouseX, mouseY).y];
        if (current_block && mouseState == "destroy") {

          mouseChunk.push(mouseChunk.splice(mouseChunk.indexOf(current_block), 1)[0]);
          mouseChunk.pop();
          mem.push(current_block.color);
        } if (mem[0] && mouseState == "create" && !current_block) {

          var newBlock = {
            x: floor(mouseX / tile_width) * tile_width,
            y: floor(mouseY / tile_height) * tile_height,
            color: mem[0]
          };
          mouseChunk.push(newBlock);
          mem.push(mem.splice(0, 1)[0]);
          mem.pop();

          if (checkCollision(px, py)) {
            mouseChunk.pop();
            mem.push(newBlock.color);
          }

        }
        drawChunk(getChunk(mouseX, mouseY).x, getChunk(mouseX, mouseY).y)
      }

      if (mouseWentDown("leftButton")) {
        var current_block = checkPosition(mouseX, mouseY);
        if (current_block) mouseState = "destroy";
        else mouseState = "create";
      }

      var xinput = (Math.min(Math.max(keyDown("d") - keyDown("a") + keyDown("right") - keyDown("left"), -1), 1));
      var jump = -keyWentDown("space");

      if (!checkCollision(px, py + vAcc)) {
        py += vAcc;
      } else {
        while (!checkCollision(px, py + 1 * (vAcc / abs(vAcc)))) {
          py += 1 * (vAcc / abs(vAcc));
        }
        vAcc = 0;
        if (jump) vAcc -= jumpForce;
      }

      if (!checkCollision(px + (xinput * xspeed), py)) {
        px += xinput * xspeed;
      } else {
        while (!checkCollision(px + (xinput), py)) {
          px += xinput;
        }
        if (jump) vAcc = -jumpForce;
      }


      if (vAcc < tile_height) vAcc += grav;

      //drawing chunks before drawing any entities
      
      //drawChunksAround(1, getChunk(px, py).x, getChunk(px, py).y);
      for (var enemy in enemies) drawChunksAround(1, enemies[enemy][0], enemies[enemy][1]);
      drawChunksAround(1, target[0], target[1]);
      drawChunksAround(1, spawner.x, spawner.y);
      drawChunksAround(2, map_width/2, 0);
      drawChunksAround(1, px, py);

      stroke(255)
      fill(0);
      textAlign(CENTER, TOP);
      textSize(50)
      text("Score: " + round(score) ,map_width/2, 0)

      if (py > map_height) {
        state="game_over";
      }

      //update enemies

      for (var enemy = 0; enemy < enemies.length; enemy++) {
        var ex = enemies[enemy][0];
        var ey = enemies[enemy][1];

        //move towards player
        var xDir = (px - ex) / abs(px - ex);
        var yDir = (py - ey) / abs(py - ey);

        if (!xDir) xDir = 0;
        if (!yDir) yDir = 0;


        ex += xDir * 1/(tile_width/10.7);
        ey += yDir * 1/(tile_width/10.7);



        //draw them
        // drawChunksAround(5, getChunk(ex, ey).x, getChunk(ex,ey).y);


        enemies[enemy][0] = ex;
        enemies[enemy][1] = ey;

        if (dist(ex, ey, px, py) < tile_width) {
          state="game_over";
        }

        //subtract enemy life for existing
        enemies[enemy][2]--;

        if(enemies[enemy][2] <= 0){
          var temp = []
          for(var i = 0; i < enemies.length-1; i++){
          	if(enemies[i] != enemies[enemy])temp.push(enemies[i]);
          }
          enemies = temp;
          continue;
        }

	fill('red');
	
	
        rect(ex - tile_width / 2, ey - tile_height / 2, tile_width, tile_height);

      }

      //spawner behaviour
      noFill();
      translate(spawner.x, spawner.y);
      rotate(World.frameCount)
      rect(-tile_width/2,-tile_height/2,tile_width, tile_height);
      rotate(-World.frameCount)
      translate(-spawner.x, -spawner.y)

      if(spawner.timer <= 0){
        enemies.push([spawner.x, spawner.y, default_lifetime] );
        console.log(enemies);
        spawner.timer = randomNumber(60* 6, 60 * 8);
        spawner.x = px + randomNumber(-tile_width * 5, tile_width * 5 );
        spawner.y = py + randomNumber(-tile_height * 5, +tile_height * 5);
      } 
      spawner.timer-= .2 + floor(score/3);
      //target behaviour
      updateTarget();

      //check if target is colliding with player and move target if that happens
      for (var j = 0; j < 4; j++) {

        var bx = px;
        var by = py;
        if (j == 0) {
          bx -= tile_width / 2;
          by -= tile_height / 2;
        }
        if (j == 1) {
          bx += tile_width / 2;
          by -= tile_height / 2;
        }
        if (j == 2) {
          bx += tile_width / 2;
          by += tile_height / 2;
        }
        if (j == 3) {
          bx -= tile_width / 2;
          by += tile_height / 2;
        }
        if (target[0] <= bx && target[0] + tile_width >= bx & target[1] <= by && target[1] + tile_height >= by) {
          targetSize = 1;
          target[0] = randomNumber(tile_width, map_width - tile_width);
          target[1] = randomNumber(tile_height, map_height - tile_height);
          score+=1;
          break;
        }
      }

      fill("white");
      rect(px - tile_width/2, py - tile_height/2, tile_width, tile_height);

    }

    function startGame() {

      drawnChunks = [];


      px = tile_width / 2 + tile_width;
      py = tile_height / 2;
      mouseState = "destroy"
      blocks = [];
      mem = [];

      default_lifetime = 60 * 15;
      enemies = [];

      spawner.x = randomNumber(tile_width, map_width - tile_width);
      spawner.y = randomNumber(tile_height, map_height - tile_height);
      spawner.timer = 60;

      score = 0;

      target = [random(TILE_SIZE*2,map_width - TILE_SIZE*2), random(TILE_SIZE*2, map_height - TILE_SIZE/2), "blue"];

      for (var i = 0; i < map_width; i += tile_width) {
        var height = noise(i / tile_width * 0.06) * map_height/1.25 - (noise(i / tile_width * 0.1) * map_height / 10 - map_height / 20) + randomNumber(-10, 10) + noise(i / tile_width * 0.06) * map_height / 4 - map_height / 8;
        for (var j = 0; j < height; j += tile_height) {
          var x = i;
          var y = round((map_height - tile_height - j) / tile_height) * tile_height;
          var color;

          color = [41, 15, 4]

          var col = j + noise(i / tile_width * 0.06) * map_width / 8;

          if (col > 2 * map_height / 12) color = [62, 28, 6]
          if (col > 3 * map_height / 12) color = [49, 42, 9];
          if (col > 4 * map_height / 12) color = [23, 81, 14];
          if (col > 5 * map_height / 12) color = [71, 111, 0];

          color[0] += 20;
          color[1] += 20;
          color[2] += 20;

          blocks.push({ x: x, y: y, color: color });
        }
      }
      //create chunks
      for (var i = 0; i < ceil(map_width / chunks_size); i++) {
        for (var j = 0; j < ceil(map_height / chunks_size); j++) {
          chunks[i][j] = [];
        }
      }
      for (var i = 0; i < blocks.length; i++) {
        chunk_x = round(blocks[i].x / chunks_size);
        chunk_y = round(blocks[i].y / chunks_size);
        chunks[chunk_x][chunk_y].push(blocks[i]);
      }
      

      drawAllChunks();

      drawnChunks = []
      
    }

    function checkPosition(x, y) {
      cx = getChunk(x, y).x;
      cy = getChunk(x, y).y;

      for (var i in chunks[cx][cy]) {
        if (chunks[cx][cy][i].x <= x && chunks[cx][cy][i].x + tile_width >= x && chunks[cx][cy][i].y <= y && chunks[cx][cy][i].y + tile_height >= y) {
          return chunks[cx][cy][i];
        }
      }
    }

    function checkCollision(x, y) {

      var tempChunks = drawChunksAround(3, x, y, true);

      var blocks = [];

      for (var chunk in tempChunks) {
        for (var block in tempChunks[chunk]) {
          blocks.push(tempChunks[chunk][block]);
        }
      }

      for (var i in blocks) {
        for (var j = 0; j < 4; j++) {
          var bx = x;
          var by = y;
          if (j == 0) {
            bx -= tile_width / 2 - 2;
            by -= tile_height / 2 - 2;
          }
          if (j == 1) {
            bx += tile_width / 2 - 2;
            by -= tile_height / 2 - 2;
          }
          if (j == 2) {
            bx += tile_width / 2 - 2;
            by += tile_height / 2 - 2;
          }
          if (j == 3) {
            bx -= tile_width / 2 - 2;
            by += tile_height / 2 - 2;
          }
          if (blocks[i].x <= bx && blocks[i].x + tile_width >= bx && blocks[i].y <= by && blocks[i].y + tile_height >= by) {
            return blocks[i];
          }
        }
      }
    }

    function getChunk(x, y) { //returns chunk from a position inside
      return {
        x: round(x / chunks_size),
        y: round(y / chunks_size)
      }
    }

    function drawChunk(x, y, overrideChunkList) {
      if (chunks[x] == undefined) return;
      if (chunks[x][y] == undefined) return;
      if (chunks[x][y] == []) return;

      
      for(var chunk = 0; chunk < drawnChunks.length; chunk++){
        if(drawnChunks[chunk] == [x,y].toString()){
          return
        }
      }

      if(!overrideChunkList)drawnChunks.push([x,y].toString());

      noStroke();
      fill(0)
      var xpos = x * chunks_size;
      var ypos = y * chunks_size;
      rect(xpos - chunks_size / 2, ypos - chunks_size / 2, chunks_size)
      for (var block in chunks[x][y]) {
        fill(chunks[x][y][block].color);
        rect(chunks[x][y][block].x, chunks[x][y][block].y, tile_width, tile_height)
      }
    }

    function updateTarget(){
      fill(target[2]);
      targetSize += .2
      if (targetSize > targetMax) targetSize = 1;
      stroke(255);
      ellipse(target[0], target[1], targetSize, targetSize);
      if(!target)target=[randomNumber(tile_width*2, map_width-tile_width*2) , randomNumber(tile_height*2, map_height-tile_height*2), "blue"]
    }

    function drawChunksAround(chunk_draw_size, x, y, dontDraw, overrideChunkList) {
      
      var chunk_x = getChunk(x, y).x;
      var chunk_y = getChunk(x, y).y;

      var chunksAround = []
      for (var i = -chunk_draw_size; i <= chunk_draw_size; i++) {
        for (var j = -chunk_draw_size; j <= chunk_draw_size; j++) {
          if(!dontDraw)drawChunk(chunk_x + i, chunk_y + j, overrideChunkList);
          if (chunks[chunk_x + i]) {
            if (chunks[chunk_x + i][chunk_y + j]) {
              chunksAround.push(chunks[chunk_x + i][chunk_y + j])
            }
          }
        }
      }
      return chunksAround;
    }

    function drawAllChunks(){
      for (var i = 0; i < chunks.length; i++) {
        for (var j = 0; j < chunks[i].length; j++) {
          drawChunk(i, j);
        }
      }
    }

    class enemy{
      constructor(x,y){
        this.x = x;
        this.y = y;
        this.life = default_lifetime;
      }



    }

    // -----
    try { window.draw = draw; } catch (e) { }
    switch (stage) {
      case 'preload':
        if (preload !== window.preload) { preload(); }
        break;
      case 'setup':
        if (setup !== window.setup) { setup(); }
        break;
    }
  }
  window.wrappedExportedCode = wrappedExportedCode;
  wrappedExportedCode('preload');
};

window.setup = function () {
  window.wrappedExportedCode('setup');
};
