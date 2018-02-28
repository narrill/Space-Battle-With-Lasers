const ModalScreen = require('./ModalScreen.js');
const utilities = require('../server/utilities.js');

class ModalConfirmationScreen extends ModalScreen {
	constructor(client, previousScreen, callback, message) {
		super(client, previousScreen, callback);
		this.message = message;
	}

	draw(now, dt) {
		super.draw(now, dt);

		const camera = this.client.camera;
		const ctx = camera.ctx;
		ctx.save();
		ctx.fillStyle = "black",
		ctx.globalAlpha = .03;
		ctx.fillRect(0,0,camera.width,camera.height);
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.globalAlpha = 1;
		utilities.fillText(ctx,this.message,camera.width/2,camera.height/2 - 30,"24pt Aroma",'white');
		ctx.restore();
	}

	keyDown(e) {
		this.exitModal();
	}
}

module.exports = ModalConfirmationScreen;