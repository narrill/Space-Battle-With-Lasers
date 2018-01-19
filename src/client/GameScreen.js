class GameScreen {
	constructor(client) {
		this.client = client;
	}

	update(dt) {
		const client = this.client;
		const titleMusic = client.titleMusic;
		const musicShuffler = client.musicShuffler;
		const ambientLoop = client.ambientLoop;
		const camera = client.camera;
		const myKeys = client.myKeys;
		const myMouse = client.myMouse;
		const mouseTimer = client.mouseTimer;
		const socket = client.socket;

		titleMusic.volume = utilities.clamp(0, titleMusic.volume - dt, 1);
    musicShuffler.update();
    ambientLoop.volume = utilities.clamp(0, ambientLoop.volume + dt, 1);
  	//camera shenanigans
  	//camera zoom controls
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_UP] && camera.zoom<=camera.maxZoom)
      camera.zoom*=1+(3-1)*dt;
    if(myKeys.keydown[myKeys.KEYBOARD.KEY_DOWN] && camera.zoom>=camera.minZoom)
      camera.zoom*=1+(.33-1)*dt;
    if(myMouse.wheel)
      camera.zoom*=1+(myMouse.wheel/2000);
    if(camera.zoom>camera.maxZoom)
      camera.zoom = camera.maxZoom;
    else if(camera.zoom<camera.minZoom)
      camera.zoom = camera.minZoom;
    client.resetWheel();

    mouseTimer.check();
    if(myMouse[myMouse.BUTTONS.LEFT] != undefined)
    {
      socket.emit('input', {mb:myMouse.BUTTONS.LEFT,pos:myMouse[myMouse.BUTTONS.LEFT]});
      myMouse[myMouse.BUTTONS.LEFT] = undefined;
    }
    if(myMouse[myMouse.BUTTONS.RIGHT] != undefined)
    {
      socket.emit('input', {mb:myMouse.BUTTONS.RIGHT,pos:myMouse[myMouse.BUTTONS.RIGHT]});
      myMouse[myMouse.BUTTONS.RIGHT] = undefined;
    }
	}

	draw(now, dt) {
		const playerInfo = worldInfo.getPlayerInfo();
		const client = this.client;
		const camera = client.camera;
		const minimapCamera = client.minimapCamera;
		const grid = client.grid;

    if(playerInfo && playerInfo.isDrawable) {
      camera.x = playerInfo.interpolateWiValue('x', now) + playerInfo.interpolateWiValue('velocityX', now)/10;
      camera.y = playerInfo.interpolateWiValue('y', now) + playerInfo.interpolateWiValue('velocityY', now)/10;

      let rotDiff = playerInfo.interpolateRotationValue('rotation', now) + playerInfo.interpolateWiValue('rotationalVelocity', now)/10 - camera.rotation;
      if(rotDiff > 180)
        rotDiff -= 360;
      else if(rotDiff < -180)
        rotDiff += 360;
      camera.rotation += utilities.lerp(0, rotDiff, 12 * dt);
      //camera.rotation+=rotDiff;
      if(camera.rotation > 180)
        camera.rotation -= 360;
      else if(camera.rotation < -180)
        camera.rotation += 360;
      minimapCamera.x = camera.x;
      minimapCamera.y = camera.y;
      minimapCamera.rotation = camera.rotation;
    }

    if(grid) drawing.drawGrid(camera, grid);
    drawing.drawAsteroidsOverlay(worldInfo.asteroids, camera, grid);
    for(let n = 0; n < worldInfo.objs.length; n++){
      const shipInfo = worldInfo.objs[n];
      if(shipInfo.isDrawable && shipInfo.hasModel) {
        shipInfo.model = worldInfo.getModel(shipInfo.getMostRecentValue('id'));
        drawing.drawShipOverlay(shipInfo, camera, grid, now);
      }
    }
    drawing.drawProjectiles(worldInfo.prjs, camera, dt, now);
    drawing.drawHitscans(worldInfo.hitscans, camera, now);
    for(let c = 0; c < worldInfo.objs.length; c++){
      const ship = worldInfo.objs[c];
      if(ship.isDrawable && ship.hasModel) {
        ship.model = worldInfo.getModel(ship.getMostRecentValue('id'));
        drawing.drawShip(ship, camera, now);
      }
    }
    drawing.drawRadials(worldInfo.radials, camera, dt, now);
    drawing.drawAsteroids(worldInfo.asteroids, worldInfo.asteroidColors, camera);
    drawing.drawHUD(camera, now);
    drawing.drawMinimap(minimapCamera, grid, now);

    if(now - startTime < 15000)
      drawing.drawTutorialGraphics(camera);
	}
}