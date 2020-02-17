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
        frameCount
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
    var tile_width = 16;
    var tile_height = 16;

    var map_width = windowWidth;
    var map_height = windowHeight;

    var px = tile_width / 2 + tile_width;
    var py = tile_height / 2;
    var pcolor = "white";
    var grav = 1;
    var blocks = [];
    var xspeed = 2;
    var jumpForce = 12;
    var vAcc = grav;

    var targetSize = 0;
    var targetMax = 15;

    var targetSize;
    var targetMax;

    var mouseState;

    var mem;
    var score = 0;
    var ex;
    var ey;
    var default_lifetime;
    var enemies;

    var target;
    var spawner = {};
    var chunks_size = tile_width * 4; //blocks

    var chunks = new Array(round(map_width / chunks_size) + 1);

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
    startGame();


    //console.log(blocks.length);

    function draw() {
      //background(0); you suck barock
      
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
          var i = mouseChunk.length - 1;
          for (var enemy in enemies) {

            for (var j = 0; j < 4; j++) {

              var bx = enemies[enemy][0];
              var by = enemies[enemy][1];
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
              if (blocks[i].x <= bx && blocks[i].x + tile_width >= bx && blocks[i].y <= by && blocks[i].y + tile_height >= by) {
                blocks.pop();
                mem.push(newBlock.color);
                break;
              }
            }
          }

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
      //if(jump)vAcc -= jumpForce;


      //draw all chunks
      /*
      for(var i = 0; i < chunks.length; i++){
        for(var j = 0; j < chunks[i].length; j++){
          drawChunk(i,j)
        }
      }
      */


      //drawing chunks before drawing any entities
      
      drawChunksAround(1, getChunk(px, py).x, getChunk(px, py).y);
      for (var enemy in enemies) drawChunksAround(2, getChunk(enemies[enemy][0], enemies[enemy][1]).x, getChunk(enemies[enemy][0], enemies[enemy][1]).y);
      drawChunksAround(1,getChunk(target[0],target[1]).x, getChunk(target[0],target[1]).y);
      drawChunk(spawner.x, spawner.y);
      drawChunksAround(2, getChunk(map_width/2, 0).x,getChunk(map_width/2, 0).y);
      
      stroke(255)
      fill(0);
      textAlign(CENTER, TOP);
      textSize(50)
      text("Score: " + score ,map_width/2, 0)
      //draw Player
      fill(pcolor);
      rect(px - tile_width / 2, py - tile_height / 2, tile_width, tile_height);

      if (py > map_height) {
        startGame();
      }

      /*
      //draw boxes
      for (var block in blocks) {
        fill(blocks[block].color);
        rect(blocks[block].x, blocks[block].y, tile_width, tile_height);
      }
      */

      //update enemies

      for (var enemy = 0; enemy < enemies.length; enemy++) {

        var ex = enemies[enemy][0];
        var ey = enemies[enemy][1];

        //move towards player
        var xDir = (px - ex) / abs(px - ex);
        var yDir = (py - ey) / abs(py - ey);

        if (!xDir) xDir = 0;
        if (!yDir) yDir = 0;


        ex += xDir/1.5;
        ey += yDir/1.5;



        //draw them
        // drawChunksAround(5, getChunk(ex, ey).x, getChunk(ex,ey).y);
        fill("red");
        rect(ex - tile_width / 2, ey - tile_height / 2, tile_width, tile_height);


        enemies[enemy][0] = ex;
        enemies[enemy][1] = ey;

        if (dist(ex, ey, px, py) < tile_width) {
          startGame();
        }

        //subtract enemy life for existing
        
        if(enemies[enemy] == undefined){
          return;
        }

        enemies[enemy][2]--;

        if (enemies[enemy][2] <= 0) {
          drawChunksAround(4,getChunk(enemies[enemy][0], enemies[enemy][1]).x, getChunk(enemies[enemy][0], enemies[enemy][1]).y)
          enemies.splice(enemy, 1);
        }


      }

      //spawner behaviour
      fill("red");
      translate(spawner.x, spawner.y);
      rotate(World.frameCount)
      rect(-tile_width/2,-tile_height/2,tile_width, tile_height);
      rotate(-World.frameCount)
      translate(-spawner.x, -spawner.y)

      if(spawner.timer <= 0){
        enemies.push([spawner.x, spawner.y, default_lifetime]);
        spawner.timer = randomNumber(60* 6, 60 * 8);
        spawner.x = px + randomNumber(-tile_width * 5, tile_width * 5 );
        spawner.y = py + randomNumber(-tile_height * 5, +tile_height * 5);
      } 
      spawner.timer-= .2 + floor(score/3);
      //target behaviour
      fill(target[2]);
      targetSize += .2
      if (targetSize > targetMax) targetSize = 1;
      ellipse(target[0], target[1], targetSize, targetSize);

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
          //do something to some score not added


          break;
        }
      }

    }

    function startGame() {

      px = tile_width / 2 + tile_width;
      py = tile_height / 2;
      mouseState = "destroy"

      mem = [];

      default_lifetime = 60 * 15;
      enemies = [[map_width/2, map_height/2, default_lifetime]];

      spawner.x = randomNumber(tile_width, map_width - tile_width);
      spawner.y = randomNumber(tile_height, map_height - tile_height);
      spawner.timer = 60;

      score = 0;

      target = [200, 200, "blue"];
      noiseSeed(randomNumber(1, 1000));
      for (var i = 0; i < map_width; i += tile_width) {
        var height = noise(i / tile_width * 0.06) * map_height / 1.5 - (noise(i / tile_width * 0.1) * map_height / 10 - map_height / 20) + randomNumber(-10, 10) + noise(i / tile_width * 0.06) * map_height / 4 - map_height / 8;
        for (var j = 0; j < height; j += tile_height) {
          var x = i;
          var y = round((map_height - tile_height - j) / tile_height) * tile_height;
          var color;
          color = [41, 15, 4]

          var col = j + noise(i / tile_width * 0.06) * map_width / 8;

          if (col > map_height / 12) color = [62, 28, 6]
          if (col > 2 * map_height / 12) color = [49, 42, 9];
          if (col > 3 * map_height / 12) color = [23, 81, 14]

          if (col > 4 * map_height / 12) color = [71, 111, 0]

          color[0] += 20;
          color[1] += 20;
          color[2] += 20;
          //console.log(height);
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
      background(0);
      
      for (var i = 0; i <= map_width; i += chunks_size) {
        for (var j = 0; j <= map_height; j += chunks_size) {
          drawChunk(getChunk(i, j).x, getChunk(i, j).y);
        }
      }
      
      
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

      var tempChunks = drawChunksAround(3, getChunk(x, y).x, getChunk(x, y).y);

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

    function drawChunk(x, y) {
      if (chunks[x] == undefined) return;
      if (chunks[x][y] == undefined) return;
      if (chunks[x][y] == []) return;
      stroke(255);
      fill(0)
      var xpos = x * chunks_size;
      var ypos = y * chunks_size;
      rect(xpos - chunks_size / 2, ypos - chunks_size / 2, chunks_size)
      for (var block in chunks[x][y]) {
        fill(chunks[x][y][block].color);
        rect(chunks[x][y][block].x, chunks[x][y][block].y, tile_width, tile_height)
      }
    }

    function drawChunksAround(chunk_draw_size, chunk_x, chunk_y) {
      var chunksAround = []
      for (var i = -chunk_draw_size; i < chunk_draw_size; i++) {
        for (var j = -chunk_draw_size; j < chunk_draw_size; j++) {
          drawChunk(chunk_x + i, chunk_y + j);
          if (chunks[chunk_x + i]) {
            if (chunks[chunk_x + i][chunk_y + j]) {
              chunksAround.push(chunks[chunk_x + i][chunk_y + j])
            }
          }
        }
      }
      return chunksAround;
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
