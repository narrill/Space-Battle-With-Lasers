// Heavily adapted from a previous project of mine:
// https://github.com/narrill/Space-Battle/blob/dev/js/drawing.js

const utilities = require('../server/utilities.js');
const worldInfoModule = require('./worldInfo.js');
const worldInfo = worldInfoModule.worldInfo;
const playerInfo = worldInfoModule.playerInfo;
const lastPlayerInfo = worldInfoModule.lastPlayerInfo;
const hudInfo = worldInfoModule.hudInfo;
const interpolateWiValue = worldInfoModule.interpolateWiValue;
const interpolateFromWiInterval = worldInfoModule.interpolateFromWiInterval;
const removeIndexFromWiCollection = worldInfoModule.removeIndexFromWiCollection;

const thrusterDetail = 3;
const hitscanDetail = 3;

const upVector = [0, 1];
const downVector = [0, -1];
const rightVector = [1, 0];
const leftVector = [-1, 0];

const shadeRGBColor = (color, percent) => {
    var f=color.split(","),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=parseInt(f[0].slice(4)),G=parseInt(f[1]),B=parseInt(f[2]);
    return "rgb("+(Math.round((t-R)*p)+R)+","+(Math.round((t-G)*p)+G)+","+(Math.round((t-B)*p)+B)+")";
}

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
	drawShipOverlay:function(ship,camera,grid){
		var ctx = camera.ctx;
		const gridZ = grid.z;		
		const gridZoom = 1/(gridZ + 1/camera.zoom);
		interpolateWiValue(ship,'x');
		interpolateWiValue(ship,'y');
		interpolateWiValue(ship,'rotation');
		var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x,ship.y); //get ship's position in camera space
		var shipPosInGridCameraSpace = camera.worldPointToCameraSpace(ship.x,ship.y,gridZ);
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(shipPosInCameraSpace[0],shipPosInCameraSpace[1]);
		ctx.lineTo(shipPosInGridCameraSpace[0],shipPosInGridCameraSpace[1]);
		ctx.translate(shipPosInGridCameraSpace[0],shipPosInGridCameraSpace[1]);
		ctx.rotate((ship.rotation-camera.rotation) * (Math.PI / 180));
		for(var type in ship.model.overlay.ranges)
		{
			ctx.arc(0,0,ship.model.overlay.ranges[type]*gridZoom,-Math.PI/2,Math.PI*2-Math.PI/2);
		}			
		ctx.rotate(-(ship.rotation-camera.rotation) * (Math.PI / 180));
		ctx.translate(-shipPosInGridCameraSpace[0],-shipPosInGridCameraSpace[1]);
		ctx.lineWidth = .5;
		ctx.strokeStyle = 'grey';
		ctx.globalAlpha = .2;
		ctx.stroke();

		ctx.globalAlpha = .5;
		ctx.translate(shipPosInGridCameraSpace[0],shipPosInGridCameraSpace[1]);
		ctx.scale(gridZoom,gridZoom);
		if(ship.model.overlay.destructible){
			ctx.beginPath();
			ctx.arc(0,0,150,-Math.PI/2,-Math.PI*2*(ship.shp)-Math.PI/2,true);
			ctx.strokeStyle = 'dodgerblue';
			ctx.lineWidth = 20;
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(0,0,125,-Math.PI/2,-Math.PI*2*(interpolateWiValue(ship,'hp'))-Math.PI/2,true);
			ctx.strokeStyle = 'green';
			ctx.stroke();
		}
		if(ship.model.overlay.colorCircle){
			ctx.beginPath();
			ctx.arc(0,0,75,0,Math.PI*2);
			ctx.fillStyle = ship.color;
			ctx.fill();	
			ctx.beginPath();
			ctx.arc(0,0,ship.radius,0,Math.PI*2);
			ctx.fillStyle = 'black';
			ctx.globalAlpha = 1;
			ctx.fill();
		}
		else{
			ctx.scale(1/gridZoom,1/gridZoom);
			ctx.beginPath();
			ctx.moveTo(ship.radius*gridZoom,0);
			ctx.arc(0,0,ship.radius*gridZoom,0,Math.PI*2);
			ctx.globalAlpha = .2;
			ctx.lineWidth = .5;
			ctx.strokeStyle = 'grey';
			ctx.stroke();
		}
		ctx.restore();
	},

	//draws the give ship's minimap representation to the given camera
	drawShipMinimap:function(ship,camera){
		var ctx = camera.ctx;
		ctx.save();
		var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x,ship.y); //get ship's position in camera space
		ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
		ctx.rotate((ship.rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

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
		ctx.fillStyle = ship.color;
		ctx.fill();
		ctx.restore();
	},

	//draws the given ship in the given camera
	drawShip: function(ship, camera){
		//var shipArray = (Array.isArray(ship))?ship:[ship];

		interpolateWiValue(ship,'x');
		interpolateWiValue(ship,'y');
		interpolateWiValue(ship,'rotation');
		var shipPosInCameraSpace = camera.worldPointToCameraSpace(ship.x,ship.y); //get ship's position in camera space

		if(shipPosInCameraSpace[0] - ship.radius * camera.zoom > camera.width || shipPosInCameraSpace[0] + ship.radius * camera.zoom< 0
			|| shipPosInCameraSpace[1] - ship.radius * camera.zoom> camera.height || shipPosInCameraSpace[1] + ship.radius * camera.zoom< 0)
			return;

		var ctx = camera.ctx;
		ctx.save();
		ctx.translate(shipPosInCameraSpace[0],shipPosInCameraSpace[1]); //translate to camera space position
		ctx.rotate((ship.rotation-camera.rotation) * (Math.PI / 180)); //rotate by difference in rotations

		ctx.scale(camera.zoom,camera.zoom); //scale by zoom value

		//Thrusters
		var width = ship.model.thrusterPoints.width;
			//forward thrust
			for(var c = 0;c<=thrusterDetail;c++){
				ctx.fillStyle = shadeRGBColor(worldInfo.targets[ship.id].thrusterColor,.5*c);
				ctx.save();
				ctx.beginPath();

				//Medial Thrusters
					//forward
						interpolateWiValue(ship, 'medial');
						var trailLength = 40*(ship.medial)*(1-(c/(thrusterDetail+1)));

						if(ship.medial>0){
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
						else if(ship.medial<0){
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
					interpolateWiValue(ship, 'rotational');
					trailLength = 40*(ship.rotational)*(1-(c/(thrusterDetail+1)));
					//ccw
						if(ship.rotational>0){
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
						else if(ship.rotational<0){
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
					interpolateWiValue(ship, 'lateral');
					trailLength = 40*(ship.lateral)*(1-(c/(thrusterDetail+1)));
					//rightward
						if(ship.lateral>0){
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
						else if(ship.lateral<0){
							//ctx.save();				
							//ctx.beginPath();
							/*ctx.moveTo(10,0);
							ctx.lineTo(10,-5);
							ctx.lineTo(10-40*(ship.thrusterSystem.lateral.currentStrength/ship.thrusterSystem.lateral.efficiency)*(1-(c/(this.thrusterDetail+1))),-2.5);
							ctx.lineTo(10,0);*/
							//ctx.globalAlpha = ((c+1)/(this.thrusterDetail+1));
							//ctx.fill();
							//ctx.restore();
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
			interpolateWiValue(ship, 'shp');
			interpolateWiValue(ship, 'shc');
			if(ship.shp>0){
				//console.log(ship.shp+', '+ship.shc);
				var shieldCoeff = (ship.shc);
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
				ctx.globalAlpha = ship.shp;
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
			ctx.fillStyle = worldInfo.targets[ship.id].color;
			ctx.fill();
			ctx.restore();
	},

	//draws all laser objects in the given array to the given camera
	drawHitscans:function(hitscans,camera){
		var ctx = camera.ctx;
		for(var n = 0;n<hitscans.length;n++){
			//if(hitscan.power == 0)
			//	return;
			var hitscan = hitscans[n];
			if(!worldInfo.drawing[hitscan.id])
				return;
			if(!worldInfo.targets[hitscan.id])
			{
				removeIndexFromWiCollection(n,worldInfo.hitscans);
				n--;
				continue;
			}
			interpolateWiValue(hitscan,'startX');
			interpolateWiValue(hitscan,'startY');
			interpolateWiValue(hitscan,'endX');
			interpolateWiValue(hitscan,'endY');
			interpolateWiValue(hitscan,'power');
			interpolateWiValue(hitscan,'efficiency');
			var start = camera.worldPointToCameraSpace(hitscan.startX,hitscan.startY);
			var end = camera.worldPointToCameraSpace(hitscan.endX,hitscan.endY);
			var angle = utilities.angleBetweenVectors(end[0]-start[0],end[1]-start[1],1,0);
			var rightVector = utilities.rotate(0,0,1,0,angle+90	);
			var width = (hitscan.power && hitscan.efficiency) ? (hitscan.power/hitscan.efficiency)*camera.zoom : 0;
			if(width<.8)
				width = .8;
			for(var c = 0;c<=hitscanDetail;c++)
			{
				var coeff = 1-(c/(hitscanDetail+1));
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(start[0],start[1]);
				ctx.lineTo(start[0]+coeff*width*rightVector[0]/2,start[1]+width*rightVector[1]/2);
				ctx.lineTo(end[0],end[1]);
				ctx.lineTo(start[0]-coeff*width*rightVector[0]/2,start[1]-width*rightVector[1]/2);
				ctx.arc(start[0],start[1],coeff*width/2,-(angle-90)*(Math.PI/180),(angle-90)*(Math.PI/180)-90,false);
				ctx.fillStyle = shadeRGBColor(worldInfo.targets[hitscan.id].color,0+c/(hitscanDetail+1));
				/*ctx.lineTo(end[0], end[1]);
				ctx.lineTo(endNext[0], endNext[1]);
				ctx.lineTo(startNext[0], startNext[1]);
				ctx.fillStyle = hitscan.color;*/
				ctx.fill();
				ctx.restore();
			}
		}
	},

	//draws all projectile objects in the given array to the given camera
	drawProjectiles: function(projectiles, camera, dt){
		var ctx = camera.ctx;
		for(var c = 0;c< projectiles.length;c++){
			var prj = projectiles[c];
			if(!worldInfo.drawing[prj.id])
				continue;
			if(!worldInfo.targets[prj.id])
			{
				removeIndexFromWiCollection(c,worldInfo.prjs);
				c--;
				continue;
			}
			interpolateWiValue(prj, 'x');
			interpolateWiValue(prj,'y');
			var start = camera.worldPointToCameraSpace(prj.x, prj.y);
			var end = camera.worldPointToCameraSpace(prj.x+worldInfo.targets[prj.id].velocityX*dt, prj.y+worldInfo.targets[prj.id].velocityY*dt);
			var radius = worldInfo.targets[prj.id].radius;

			if(start[0] > camera.width+radius || start[0] < 0 - radius || start[1] > camera.height + radius || start[1] < 0 - radius)
				continue;

			ctx.save();
			ctx.beginPath();
			ctx.moveTo(start[0], start[1]);
			ctx.lineTo(end[0], end[1]);
			ctx.strokeStyle = worldInfo.targets[prj.id].color;
			var width = radius*camera.zoom;
			ctx.lineWidth = (width>1)?width:1;
			ctx.stroke();
			ctx.restore();
		}
	},

	drawRadials:function(radials, camera, dt){
		var ctx = camera.ctx;
		for(var c = 0;c<radials.length;c++){
			var radial = radials[c];
			if(!worldInfo.drawing[radial.id])
				return;
			if(!worldInfo.targets[radial.id])
			{
				removeIndexFromWiCollection(c,worldInfo.radials);
				c--;
				continue;
			}
			interpolateWiValue(radial,'x');
			interpolateWiValue(radial,'y');
			interpolateWiValue(radial,'radius');
			interpolateWiValue(radial,'velocity');
			var center = camera.worldPointToCameraSpace(radial.x, radial.y);
			var frameVelocity = radial.velocity * dt;

			if(center[0] > camera.width+radial.radius+frameVelocity || center[0] < 0 - radial.radius-frameVelocity || center[1] > camera.height + radial.radius+frameVelocity || center[1] < 0 - radial.radius-frameVelocity)
				return;

			ctx.save();
			ctx.beginPath();
			ctx.arc(center[0], center[1], (radial.radius+frameVelocity/2)*camera.zoom, 0, Math.PI*2);
			ctx.strokeStyle = worldInfo.targets[radial.id].color;
			var width = frameVelocity*camera.zoom
			ctx.lineWidth = (width>.3)?width:.1;
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
			for(var c = 0; c<asteroids.objs.length;c++)
			{
				var asteroid = asteroids.objs[c];
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
	drawAsteroids: function(asteroids,camera){
		var start = [0,0];
		var end = [camera.width,camera.height];
		var ctx = camera.ctx;
		for(var group = 0;group<asteroids.colors.length;group++){
			ctx.save()
			ctx.fillStyle = asteroids.colors[group];
			ctx.beginPath();
			for(var c = 0;c<asteroids.objs.length;c++){
				var asteroid = asteroids.objs[c];
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
	drawHUD: function(camera){
		var ctx = camera.ctx;
		ctx.save(); // NEW
		ctx.textAlign = 'center';
		ctx.textBaseline = 'center';
		ctx.fillRect(0,camera.height,camera.width,-30);
		utilities.fillText(ctx, ((hudInfo.stabilized)?'assisted':'manual'),camera.width/2,camera.height-10,"bold 12pt Orbitron",(hudInfo.stabilized)?'green':'red');
		ctx.textAlign = 'left';
		utilities.fillText(ctx,'limiter',10,camera.height-10,"8pt Orbitron",'white');
		if(hudInfo.velocityClamps.enabled)
		{
			ctx.textAlign = 'right';
			utilities.fillText(ctx,Math.round(hudInfo.velocityClamps.medial),110,camera.height-10,"10pt Orbitron",'green');
			utilities.fillText(ctx,Math.round(hudInfo.velocityClamps.lateral),160,camera.height-10,"10pt Orbitron",'cyan');
			utilities.fillText(ctx,Math.round(hudInfo.velocityClamps.rotational),195,camera.height-10,"10pt Orbitron",'yellow');
		}
		else
		{
			ctx.textAlign = 'left';
			utilities.fillText(ctx,'disabled',110,camera.height-10,"10pt Orbitron",'red');
		}
		//utilities.fillText(ctx, "Thruster clamps: "+((this.ship.stabilizer.clamps.enabled)?'Medial '+Math.round(this.ship.stabilizer.clamps.medial)+' Lateral '+Math.round(this.ship.stabilizer.clamps.lateral)+' Rotational '+Math.round(this.ship.stabilizer.clamps.rotational):'disabled'),0,camera.height-10,"12pt Prime",'white')
		ctx.textAlign = 'right';
		utilities.fillText(ctx,'T '+Math.round(interpolateFromWiInterval(lastPlayerInfo.thrusterPower, playerInfo.thrusterPower) *100)+'%',camera.width-220,camera.height-10,"10pt Orbitron",'green');
		utilities.fillText(ctx,' W '+Math.round(interpolateFromWiInterval(lastPlayerInfo.weaponPower, playerInfo.weaponPower)*100)+'%',camera.width-120,camera.height-10,"10pt Orbitron",'red');
		utilities.fillText(ctx,' S '+Math.round(interpolateFromWiInterval(lastPlayerInfo.shieldPower, playerInfo.shieldPower)*100)+'%',camera.width-20,camera.height-10,"10pt Orbitron",'dodgerblue');
		
		ctx.restore(); // NEW
	},

	//draws the minimap to the given camera
	//note that the minimap camera has a viewport
	drawMinimap:function(camera, grid){
		var ctx = camera.viewport.parent.ctx;
		var viewportStart = [camera.viewport.parent.width*camera.viewport.startX,camera.viewport.parent.height*camera.viewport.startY];
		var viewportEnd = [camera.viewport.parent.width*camera.viewport.endX,camera.viewport.parent.height*camera.viewport.endY];
		var viewportDimensions = [viewportEnd[0]-viewportStart[0],viewportEnd[1]-viewportStart[1]];
		ctx.save();
		ctx.translate(0,-30);
		ctx.beginPath();
		ctx.rect(viewportStart[0],viewportStart[1],viewportDimensions[0],viewportDimensions[1]);
		ctx.fillStyle = 'black';
		ctx.fill();
		ctx.clip();
		ctx.translate((viewportStart[0]+viewportDimensions[0]/2-camera.width/2),(viewportStart[1]+viewportDimensions[1]/2-camera.height/2));
		//ctx.translate(600,300);
		if(grid) drawing.drawGrid(camera, grid, true);
		drawing.drawAsteroids(worldInfo.asteroids,camera);
		for(var n = worldInfo.objs.length-1;n>=0;n--){
			var ship = worldInfo.objs[n];
			if(worldInfoModule.modelInfo[ship.id]) {
				ship.model = worldInfoModule.modelInfo[ship.id];
				drawing.drawShipMinimap(ship,camera);
			}
		}
		ctx.restore();
	},

	drawTitleScreen:function(camera, osc){
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
		const bigOffset = osc.getValue(now/1000 - 1) * 4;
		utilities.fillText(ctx,"Space Battle With Lasers",camera.width/2,bigOffset + camera.height/5,"bold 64pt Aroma",'blue',.5);
		utilities.fillText(ctx,"SPACE BATTLE WITH LASERS",camera.width/2,smallOffset + camera.height/5,"bold 24pt Aroma",'white');
		utilities.fillText(ctx,"Press ENTER to start",camera.width/2,4*camera.height/5,"12pt Orbitron",'white');
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

	//draw pause screen in the given camera
	drawChooseShipScreen:function(camera, entry, shipList = []){
		var ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = "black",
		ctx.globalAlpha = .03;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		utilities.fillText(ctx,"Enter ship name: "+entry,camera.width/2,camera.height/2 - 30,"24pt Aroma",'white');
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
		utilities.fillText(ctx,"SPACE or LEFT-CLICK fires your laser",camera.width/10,4*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"SHIFT over-charges your thrusters",camera.width/10,5*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"ALT over-charges your shield",camera.width/10,6*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"RIGHT-CLICK over-charges your laser",camera.width/10,7*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"C toggles the velocity limiter",camera.width/10,8*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"TAB switches between assisted and manual controls",camera.width/10,9*camera.height/11,"10pt Orbitron",'white');
		utilities.fillText(ctx,"Your goal is to destroy all enemy ships",camera.width/10,10*camera.height/11,"10pt Orbitron",'white');
		//this.fill
	},
};

module.exports = drawing;