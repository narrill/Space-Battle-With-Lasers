// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

const utilities = require('../server/utilities.js');
const worldInfo = require('./worldInfo.js');

const thrusterDetail = 3;
const hitscanDetail = 3;

const upVector = [0, 1];
const downVector = [0, -1];
const rightVector = [1, 0];
const leftVector = [-1, 0];

const drawing = {
  //clears the given camera's canvas
  clearCamera:function(camera){
    var ctx = camera.ctx;
    ctx.fillStyle = "black"; 
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.fill();
  },  

  // Draws the grid graphic. This could use some improving, but whatever
  drawGrid (camera, grid) {
    const ctx = camera.ctx;
    const gridLines = grid.gridLines;
    const gridSpacing = grid.gridSpacing;
    const gridStart = grid.gridStart;

    for(let c = 0; c < grid.colors.length; c++){ 
      ctx.save();
      ctx.beginPath();
      for(let x = 0; x <= gridLines; x++){
        if(x % grid.colors[c].interval != 0)
          continue;
        let correctInterval = true;
        for(let n = 0; n < c; n++)
        {
          if(x % grid.colors[n].interval == 0)
          {
            correctInterval = false;
            break;
          }
        }
        if(correctInterval != true)
          continue;

        //define start and end points for current line in world space
        let start = [gridStart[0] + x * gridSpacing, gridStart[1]];
        let end = [start[0], gridStart[1] + gridLines * gridSpacing];

        //convert to camera space
        start = camera.worldPointToCameraSpace(start[0], start[1], grid.z);
        end = camera.worldPointToCameraSpace(end[0], end[1], grid.z);      
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
      }
      for(let y = 0; y <= gridLines; y++){
        if(y % grid.colors[c].interval != 0)
          continue;
        let correctInterval = true;
        for(let n = 0; n < c; n++)
        {
          if(y % grid.colors[n].interval == 0)
          {
            correctInterval = false;
            break;
          }
        }
        if(correctInterval!=true)
          continue;

        //same as above, but perpendicular
        let start = [gridStart[0], gridStart[0] + y * gridSpacing];
        let end = [gridStart[0] + gridLines * gridSpacing, start[1]];
        start = camera.worldPointToCameraSpace(start[0], start[1], grid.z);
        end = camera.worldPointToCameraSpace(end[0], end[1], grid.z);
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
      }

      //draw all lines, stroke last
      ctx.globalAlpha = .3;
      ctx.strokeWidth = 5;
      ctx.strokeStyle = grid.colors[c].color;
      ctx.stroke();
      ctx.restore();
    }
  },
  //draws the projected overlay (shields, health, laser range) for the given ship using the two given cameras (one for the gameplay plane and one for the projected plane)
  drawShipOverlay:function(ship, camera, grid, time){
    var ctx = camera.ctx;
    const gridZ = grid.z;   
    const gridZoom = 1/(gridZ + 1/camera.zoom);
    const x = ship.interpolateWiValue('x', time);
    const y = ship.interpolateWiValue('y', time);
    const rotation = ship.interpolateWiValue('rotation', time);
    const radius = ship.getMostRecentValue('radius');
    const color = ship.getMostRecentValue('color').colorString;

    var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
    var shipPosInGridCameraSpace = camera.worldPointToCameraSpace(x, y, gridZ);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(shipPosInCameraSpace[0], shipPosInCameraSpace[1]);
    ctx.lineTo(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
    ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
    ctx.rotate((rotation - camera.rotation) * (Math.PI / 180));
    for(var type in ship.model.overlay.ranges)
    {
      ctx.arc(0, 0, ship.model.overlay.ranges[type] * gridZoom, -Math.PI / 2, Math.PI * 2 - Math.PI / 2);
    }     
    ctx.rotate(-(rotation - camera.rotation) * (Math.PI / 180));
    ctx.translate(-shipPosInGridCameraSpace[0], -shipPosInGridCameraSpace[1]);
    ctx.lineWidth = .5;
    ctx.strokeStyle = 'grey';
    ctx.globalAlpha = .2;
    ctx.stroke();

    ctx.globalAlpha = .5;
    ctx.translate(shipPosInGridCameraSpace[0], shipPosInGridCameraSpace[1]);
    ctx.scale(gridZoom, gridZoom);
    if(ship.model.overlay.destructible){
      ctx.beginPath();
      ctx.arc(0, 0, 5*radius, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('shp', time)) - Math.PI / 2, true);
      ctx.strokeStyle = 'dodgerblue';
      ctx.lineWidth = 2*radius;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 3*radius, -Math.PI / 2, -Math.PI * 2 * (ship.interpolateWiValue('hp', time)) - Math.PI / 2, true);
      ctx.strokeStyle = 'green';
      ctx.stroke();
    }
    if(ship.model.overlay.colorCircle){
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill(); 
      // ctx.beginPath();
      // ctx.arc(0, 0, radius, 0, Math.PI * 2);
      // ctx.fillStyle = 'black';
      // ctx.globalAlpha = 1;
      // ctx.fill();
    }
    else{
      ctx.scale(1 / gridZoom, 1 / gridZoom);
      ctx.beginPath();
      ctx.moveTo(radius * gridZoom, 0);
      ctx.arc(0, 0, radius * gridZoom, 0, Math.PI * 2);
      ctx.globalAlpha = .2;
      ctx.lineWidth = .5;
      ctx.strokeStyle = 'grey';
      ctx.stroke();
    }
    ctx.restore();
  },

  //draws the give ship's minimap representation to the given camera
  drawShipMinimap:function(ship, camera, time){
    var ctx = camera.ctx;
    ctx.save();
    const x = ship.interpolateWiValue('x', time);
    const y = ship.interpolateWiValue('y', time);
    const rotation = ship.interpolateRotationValue('rotation', time);
    const color = ship.getMostRecentValue('color').colorString;
    var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
    ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
    ctx.rotate((rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

    ctx.scale(.5,.5); //scale by zoom value

    //ctx.translate(0,7);
    ctx.beginPath();
    ctx.moveTo(ship.model.vertices[0][0],ship.model.vertices[0][1]);
    for(var c = 1;c<ship.model.vertices.length;c++)
    {
      var vert = ship.model.vertices[c];
      ctx.lineTo(vert[0],vert[1]);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },

  //draws the given ship in the given camera
  drawShip: function(ship, camera, time){
    const x = ship.interpolateWiValue('x', time);
    const y = ship.interpolateWiValue('y', time);
    //console.log(`Ship world: ${x}, ${y}`);
    const rotation = ship.interpolateRotationValue('rotation', time);
    const radius = ship.getMostRecentValue('radius');
    const thrusterColor = ship.getMostRecentValue('thrusterColor');
    const color = ship.getMostRecentValue('color').colorString;

    var shipPosInCameraSpace = camera.worldPointToCameraSpace(x,y); //get ship's position in camera space
    //console.log(`Ship camera: ${shipPosInCameraSpace[0]}, ${shipPosInCameraSpace[1]}`);
    if(shipPosInCameraSpace[0] - radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + radius * camera.zoom< 0
      || shipPosInCameraSpace[1] - radius * camera.zoom> camera.height || shipPosInCameraSpace[1] + radius * camera.zoom< 0)
      return;

    var ctx = camera.ctx;
    ctx.save();
    ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
    ctx.rotate((rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

    ctx.scale(camera.zoom,camera.zoom); //scale by zoom value

    //Thrusters
    var width = ship.model.thrusterPoints.width;
    //forward thrust
    for(var c = 0;c<=thrusterDetail;c++) {
      ctx.fillStyle = thrusterColor.shade(.5*c).colorString;
      ctx.save();
      ctx.beginPath();

      //Medial Thrusters
      //forward
      const medial = ship.interpolateWiValue('medial', time);
      var trailLength = 40*(medial)*(1-(c/(thrusterDetail+1)));

      if(medial>0){
        for(var n = 0; n<ship.model.thrusterPoints.medial.positive.length;n++)
        {
          var tp = ship.model.thrusterPoints.medial.positive[n];
          ctx.moveTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
          ctx.lineTo(tp[0]-rightVector[0]*width/2,tp[1]-rightVector[1]*width/2);
          ctx.lineTo(tp[0]+upVector[0]*trailLength,tp[1]+upVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
        }
      }
      //backward
      else if(medial<0){
        for(var n = 0; n<ship.model.thrusterPoints.medial.positive.length;n++)
        {
          var tp = ship.model.thrusterPoints.medial.negative[n];
          ctx.moveTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
          ctx.lineTo(tp[0]-rightVector[0]*width/2,tp[1]-rightVector[1]*width/2);
          ctx.lineTo(tp[0]+upVector[0]*trailLength,tp[1]+upVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+rightVector[0]*width/2,tp[1]+rightVector[1]*width/2);
        }
      } 

      //rotational thrusters  
      const rotational = ship.interpolateWiValue('rotational', time);
      trailLength = 40*(rotational)*(1-(c/(thrusterDetail+1)));
      //ccw
      if(rotational>0){
        for(var n = 0; n<ship.model.thrusterPoints.rotational.positive.length;n++)
        {
          var tp = ship.model.thrusterPoints.rotational.positive[n];
          ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
          ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
          ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
        }
      }
      //cw
      else if(rotational<0){
        for(var n = 0; n<ship.model.thrusterPoints.rotational.negative.length;n++)
        {
          var tp = ship.model.thrusterPoints.rotational.negative[n];
          ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
          ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
          ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
        }
      }

      //lateral thrusters
      const lateral = ship.interpolateWiValue('lateral', time);
      trailLength = 40*(lateral)*(1-(c/(thrusterDetail+1)));
      //rightward
      if(lateral>0){
        for(var n = 0; n<ship.model.thrusterPoints.lateral.positive.length;n++)
        {
          var tp = ship.model.thrusterPoints.lateral.positive[n];
          ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
          ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
          ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
        }
      }
      //leftward
      else if(lateral<0){
        for(var n = 0; n<ship.model.thrusterPoints.lateral.negative.length;n++)
        {
          var tp = ship.model.thrusterPoints.lateral.negative[n];
          ctx.moveTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
          ctx.lineTo(tp[0]-upVector[0]*width/2,tp[1]-upVector[1]*width/2);
          ctx.lineTo(tp[0]+rightVector[0]*trailLength,tp[1]+rightVector[1]*trailLength); //furthest point goes outward with thruster strength and scales inward with efficiency
          ctx.lineTo(tp[0]+upVector[0]*width/2,tp[1]+upVector[1]*width/2);
        }
      }

      ctx.globalAlpha = ((c+1)/(this.thrusterDetail+1));
      ctx.fill();
      ctx.restore();
    }

    //shields
    const shp = ship.interpolateWiValue('shp', time);
    const shc = ship.interpolateWiValue('shc', time);
    if(shp>0){
      var shieldCoeff = (shc);
      ctx.save();
      ctx.fillStyle = 'dodgerblue';
      ctx.beginPath();
      for(var n = 0; n<ship.model.shieldVectors.length; n++){
        var vert = ship.model.vertices[n];
        var vec = ship.model.shieldVectors[n];
        var shieldVert = [vert[0]+vec[0]*shieldCoeff,vert[1]+vec[1]*shieldCoeff];
        if(n==0)
          ctx.moveTo(shieldVert[0],shieldVert[1]);
        else
          ctx.lineTo(shieldVert[0],shieldVert[1]);
      }
      ctx.globalAlpha = shp;
      ctx.fill();
      ctx.restore();
    }

    //the rest of the ship
    ctx.beginPath();
    ctx.moveTo(ship.model.vertices[0][0],ship.model.vertices[0][1]);
    for(var c = 1;c<ship.model.vertices.length;c++)
    {
      var vert = ship.model.vertices[c];
      ctx.lineTo(vert[0],vert[1]);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  },

  //draws all laser objects in the given array to the given camera
  drawHitscans:function(hitscans, camera, time){
    var ctx = camera.ctx;
    for(var n = 0; n < hitscans.length; n++){
      var hitscan = hitscans[n];
      if(!hitscan.isDrawable)
        continue;
      const startX = hitscan.interpolateWiValue('startX', time);
      const startY = hitscan.interpolateWiValue('startY', time);
      const endX = hitscan.interpolateWiValue('endX', time);
      const endY = hitscan.interpolateWiValue('endY', time);
      const power = hitscan.interpolateWiValue('power', time);
      const efficiency = hitscan.interpolateWiValue('efficiency', time);
      var start = camera.worldPointToCameraSpace(startX, startY);
      var end = camera.worldPointToCameraSpace(endX, endY);
      var angle = utilities.angleBetweenVectors(end[0] - start[0], end[1] - start[1], 1, 0);
      var rightVector = utilities.rotate(0, 0, 1, 0, angle + 90);
      var width = (power && efficiency) ? (power / efficiency) * camera.zoom : 0;
      if(width < .8)
        width = .8;
      for(var c = 0; c <= hitscanDetail; c++)
      {
        var coeff = 1 - (c / (hitscanDetail + 1));
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(start[0] + coeff * width * rightVector[0] / 2, start[1] + width * rightVector[1] / 2);
        ctx.lineTo(end[0], end[1]);
        ctx.lineTo(start[0] - coeff * width * rightVector[0] / 2, start[1] - width * rightVector[1] / 2);
        ctx.arc(start[0], start[1], coeff * width / 2, -(angle - 90) * (Math.PI / 180), (angle - 90) * (Math.PI / 180) - 90, false);
        ctx.fillStyle = hitscan.getMostRecentValue('color').shade(0 + c / (hitscanDetail + 1)).colorString;
        ctx.fill();
        ctx.restore();
      }
    }
  },

  //draws all projectile objects in the given array to the given camera
  drawProjectiles: function(projectiles, camera, dt, time){
    var ctx = camera.ctx;
    for(var c = 0;c< projectiles.length;c++){
      var prj = projectiles[c];
      const ageSeconds = (time - worldInfo.interpDelay - prj.arrivalTime) / 1000;
      const velX = prj.velocityX;
      const velY = prj.velocityY;
      const x = prj.x + (ageSeconds * velX);
      const y = prj.y + (ageSeconds * velY);
      var start = camera.worldPointToCameraSpace(x, y);
      // console.log(`Prj camera: ${start[0]}, ${start[1]}`);
      //console.log(start);
      //var end = camera.worldPointToCameraSpace(x - velX * dt, y - velY * dt);
      const radius = prj.radius;

      if(ageSeconds < 0 || start[0] > camera.width + radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius)
        continue;

      ctx.save();
      ctx.beginPath();
      //ctx.moveTo(start[0], start[1]);
      //ctx.lineTo(end[0], end[1]);
      //ctx.strokeStyle = prj.color.colorString;
      //var width = radius*camera.zoom;
      //ctx.lineWidth = (width>1)?width:1;
      //ctx.stroke();
      ctx.arc(start[0], start[1], radius * camera.zoom, 0, 2 * Math.PI);
      ctx.fillStyle = prj.color.colorString;
      ctx.fill();
      ctx.restore();
    }
  },

  drawRadials:function(radials, camera, dt, time){
    var ctx = camera.ctx;
    for(var c = 0;c<radials.length;c++){
      var radial = radials[c];
      if(!radial.isDrawable)
        continue;
      const x = radial.interpolateWiValue('x', time);
      const y = radial.interpolateWiValue('y', time);
      const velocity = radial.interpolateWiValue('velocity', time);
      const radius = radial.interpolateWiValue('radius', time);
      var center = camera.worldPointToCameraSpace(x, y);
      var frameVelocity = velocity * dt;

      if(center[0] > camera.width + radius + frameVelocity || center[0] < 0 - radius-frameVelocity || center[1] > camera.height + radius+frameVelocity || center[1] < 0 - radius-frameVelocity)
        return;

      ctx.save();
      ctx.beginPath();
      ctx.arc(center[0], center[1], (radius + frameVelocity / 2) * camera.zoom, 0, Math.PI * 2);
      ctx.strokeStyle = radial.getMostRecentValue('color').colorString;
      var width = frameVelocity * camera.zoom;
      ctx.lineWidth = (width > .3) ? width : .1;
      ctx.stroke();
      ctx.restore();
    };
  },

  //draws the projected overlay for all asteroids in the given array to the given main and projected cameras
  drawAsteroidsOverlay:function(asteroids, camera, grid){
    var start = [0,0];
    var end = [camera.width,camera.height];
    var ctx = camera.ctx;
    var cameraPositions = [];
    const gridZoom = 1/(grid.z + 1/camera.zoom);
    if(grid)
    {
      ctx.save();
      ctx.beginPath();
      for(var c = 0; c<asteroids.length;c++)
      {
        var asteroid = asteroids[c];
        var gridPosition = camera.worldPointToCameraSpace(asteroid.x,asteroid.y, grid.z);
        if(gridPosition[0] + asteroid.radius*gridZoom<start[0] || gridPosition[0] - asteroid.radius*gridZoom>end[0] || gridPosition[1] + asteroid.radius*gridZoom<start[1] || gridPosition[1] - asteroid.radius*gridZoom>end[1])
          continue;     
        cameraPositions[c] =(camera.worldPointToCameraSpace(asteroid.x,asteroid.y));
        ctx.moveTo(cameraPositions[c][0],cameraPositions[c][1]);
        ctx.lineTo(gridPosition[0],gridPosition[1]);
        ctx.moveTo(gridPosition[0],gridPosition[1]);
        //ctx.beginPath();
        ctx.arc(gridPosition[0],gridPosition[1], asteroid.radius*gridZoom,0,Math.PI*2);
      } 
      ctx.strokeStyle = 'grey';
      ctx.lineWidth = .5;
      ctx.globalAlpha = .5;
      ctx.stroke();
      ctx.restore();    
    }
  },

  //draws asteroids from the given asteroids array to the given camera
  drawAsteroids: function(asteroids, colors, camera){
    var start = [0,0];
    var end = [camera.width,camera.height];
    var ctx = camera.ctx;
    for(var group = 0;group<colors.length;group++){
      ctx.save()
      ctx.fillStyle = colors[group];
      ctx.beginPath();
      for(var c = 0;c<asteroids.length;c++){
        var asteroid = asteroids[c];
        if(asteroid.colorIndex!=group)
          continue;

        const zoom = 1/((asteroid.z) ? asteroid.z : 0 + 1/camera.zoom);
        var finalPosition = camera.worldPointToCameraSpace(asteroid.x,asteroid.y,asteroid.z); //get asteroid's position in camera space
        
        if(finalPosition[0] + asteroid.radius*zoom<start[0] || finalPosition[0]-asteroid.radius*zoom>end[0] || finalPosition[1] + asteroid.radius*zoom<start[1] || finalPosition[1]-asteroid.radius*zoom>end[1])
            continue;
        ctx.moveTo(finalPosition[0],finalPosition[1]);
        ctx.arc(finalPosition[0],finalPosition[1],asteroid.radius*zoom,0,Math.PI*2);
      };
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
  },

  //draws the heads-up display to the given camera
  drawHUD: function(camera, time){
    const hudInfo = worldInfo.getPlayerInfo();
    if(!hudInfo.isDrawable)
      return;
    var ctx = camera.ctx;
    ctx.save(); // NEW
    ctx.textAlign = 'center';
    ctx.textBaseline = 'center';
    ctx.fillRect(0,camera.height,camera.width, - 30);
    utilities.fillText(ctx, ((hudInfo.current.stabilized) ? 'assisted' : 'manual'), camera.width / 2, camera.height - 10, "bold 12pt Orbitron", (hudInfo.current.stabilized) ? 'green' : 'red');
    ctx.textAlign = 'left';
    utilities.fillText(ctx, 'limiter', 10, camera.height - 10, "8pt Orbitron", 'white');
    if(hudInfo.current.clampEnabled)
    {
      const medial = hudInfo.interpolateWiValue('clampMedial', time);
      const lateral = hudInfo.interpolateWiValue('clampLateral', time);
      const rotational = hudInfo.interpolateWiValue('clampRotational', time);
      ctx.textAlign = 'right';
      utilities.fillText(ctx, Math.round(medial), 110, camera.height - 10, "10pt Orbitron", 'green');
      utilities.fillText(ctx, Math.round(lateral), 160, camera.height - 10, "10pt Orbitron", 'cyan');
      utilities.fillText(ctx, Math.round(rotational), 195, camera.height - 10, "10pt Orbitron", 'yellow');
    }
    else
    {
      ctx.textAlign = 'left';
      utilities.fillText(ctx, 'disabled', 110, camera.height - 10, "10pt Orbitron", 'red');
    }
    
    ctx.textAlign = 'right';
    const thrusterPower = hudInfo.interpolateWiValue('thrusterPower', time);
    const weaponPower = hudInfo.interpolateWiValue('weaponPower', time);
    const shieldPower = hudInfo.interpolateWiValue('shieldPower', time);
    utilities.fillText(ctx, 'T ' + Math.round(thrusterPower * 100) + '%',camera.width - 220, camera.height - 10, "10pt Orbitron", 'green');
    utilities.fillText(ctx, ' W ' + Math.round(weaponPower * 100) + '%', camera.width - 120, camera.height - 10, "10pt Orbitron", 'red');
    utilities.fillText(ctx, ' S ' + Math.round(shieldPower * 100) + '%', camera.width - 20, camera.height - 10, "10pt Orbitron", 'dodgerblue');
    
    ctx.restore(); // NEW
  },

  drawMultiLineText(camera, text, x, y, font) {
    const ctx = camera.ctx;
    ctx.font = font;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'white';
    var lineHeight = ctx.measureText("M").width * 1.2;
    var lines = text.split("\n");
    for (var i = lines.length - 1; i >= 0; --i) {
      ctx.fillText(lines[i], x, y);
      y += lineHeight;
    }
  },

  //draws the minimap to the given camera
  //note that the minimap camera has a viewport
  drawMinimap:function(camera, grid, time){
    var ctx = camera.viewport.parent.ctx;
    var viewportStart = [camera.viewport.parent.width * camera.viewport.startX, camera.viewport.parent.height * camera.viewport.startY];
    var viewportEnd = [camera.viewport.parent.width * camera.viewport.endX, camera.viewport.parent.height * camera.viewport.endY];
    var viewportDimensions = [viewportEnd[0] - viewportStart[0], viewportEnd[1] - viewportStart[1]];
    ctx.save();
    ctx.translate(0, -30);
    ctx.beginPath();
    ctx.rect(viewportStart[0], viewportStart[1], viewportDimensions[0], viewportDimensions[1]);
    ctx.fillStyle = 'black';
    ctx.fill();
    ctx.clip();
    ctx.translate((viewportStart[0] + viewportDimensions[0] / 2 - camera.width / 2), (viewportStart[1] + viewportDimensions[1] / 2 - camera.height / 2));
    //ctx.translate(600,300);
    if(grid) drawing.drawGrid(camera, grid, true);
    drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
    for(var n = worldInfo.objs.length - 1; n >= 0; n--){
      var ship = worldInfo.objs[n];
      const model = worldInfo.getModel(ship.id);
      if(model && ship.isDrawable) {
        ship.model = model;
        drawing.drawShipMinimap(ship, camera, time);
      }
    }
    ctx.restore();
  },

  drawTitleScreen:function(camera, osc, menu){
    var ctx = camera.ctx;
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.globalAlpha = .5;
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    const now = Date.now();
    const smallOffset = osc.getValue(now/1000) * 6;
    const bigOffset = osc.getValue(now/1000 - osc.period/6) * 4;
    utilities.fillText(ctx,"Space Battle With Lasers",camera.width/2,bigOffset + camera.height/5,"bold 64pt Aroma",'blue',.5);
    utilities.fillText(ctx,"SPACE BATTLE WITH LASERS",camera.width/2,smallOffset + camera.height/5,"bold 24pt Aroma",'white');
    if(menu) {
      menu.draw(ctx, camera.width / 2, 4 * camera.height / 5, "24pt Orbitron", true);
    }
    else {
      utilities.fillText(ctx,"Press ENTER to start",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
    }
    ctx.restore();
  },

  drawWinScreen:function(camera){
    var ctx = camera.ctx;
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.globalAlpha = .5;
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    utilities.fillText(ctx,"You win!",camera.width/2,camera.height/5,"24pt Aroma",'white');
    utilities.fillText(ctx,"Good for you. Press R to continue.",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
    ctx.restore();    
  },

  drawDisconnectScreen:function(camera){
    var ctx = camera.ctx;
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.globalAlpha = .5;
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    utilities.fillText(ctx,"Connection lost",camera.width/2,2*camera.height/5,"24pt Aroma",'white');
    utilities.fillText(ctx,"Press ENTER to send another ship",camera.width/2,3*camera.height/5,"12pt Orbitron",'white');
    ctx.restore();    
  },

  drawEntryScreen: function(camera, entryPrompt, entry) {
    const ctx = camera.ctx;
    ctx.save();
    ctx.fillStyle = "black",
    ctx.globalAlpha = .03;
    ctx.fillRect(0,0,camera.width,camera.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 1;
    utilities.fillText(ctx,entryPrompt+": "+entry,camera.width/2,camera.height/2 - 30,"24pt Aroma",'white');
    ctx.restore();
  },

  //draw pause screen in the given camera
  drawChooseShipScreen:function(camera, entry, shipList = []){
    var ctx = camera.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var list = "Options: ";
    for(var c = 0;c<shipList.length;c++)
    {
      if(c>0)list+=', ';
      list+=shipList[c];
    }
    utilities.fillText(ctx,list,camera.width/2,camera.height/2 +30,"10pt Orbitron",'white');
    ctx.restore();
  },

  //draws the "click me" graphic
  drawLockedGraphic:function(camera){
    var ctx = camera.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    utilities.fillText(ctx,"Click me",camera.width/2,camera.height/2,"10pt Orbitron",'white');
    ctx.restore();
  },

  drawTutorialGraphics:function(camera){
    var ctx = camera.ctx;
    ctx.save();
    ctx.textAlign = 'left';
    utilities.fillText(ctx,"WASD moves your ship",camera.width/10,camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"LEFT and RIGHT arrow or mouse turns your ship",camera.width/10,2*camera.height/11,"10pt Orbitron",'white');   
    utilities.fillText(ctx,"UP and DOWN arrow or mouse-wheel zooms the camera",camera.width/10,3*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"SPACE or LEFT-CLICK fires your weapon",camera.width/10,4*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"SHIFT over-charges your thrusters",camera.width/10,5*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"ALT over-charges your shield",camera.width/10,6*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"RIGHT-CLICK over-charges your weapon",camera.width/10,7*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"C toggles the velocity limiter",camera.width/10,8*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"TAB switches between assisted and manual controls",camera.width/10,9*camera.height/11,"10pt Orbitron",'white');
    utilities.fillText(ctx,"Your goal is to destroy all enemy ships",camera.width/10,10*camera.height/11,"10pt Orbitron",'white');
    //this.fill
    ctx.restore();
  },
};

module.exports = drawing;