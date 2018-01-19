const utilities = require('../server/utilities.js');

class TrackShuffler {
	constructor(trackNames, overlapSeconds = 0) {
		const tracks = [];
		for(const name in trackNames){
			const audio = new Audio();
			audio.setAttribute('src', `${name}.mp3`);
		}
		this.tracks = tracks;
		this.currentTrack = tracks[0];
		this.currentTrackIndex = 0;
		this.previousTrack = undefined;
		this.overlapSeconds = overlapSeconds;
		this._playing = false;
	}

	play() {
		this._playing = true;
		this.currentTrack.play();
		if(this.previousTrack)
			this.previousTrack.play();
	}

	pause() {
		this._playing = false;
		this.currentTrack.pause();
		if(this.previousTrack)
			this.previousTrack.pause();
	}

	get playing() {
		return this._playing;
	}

	update() {
		if(this.currentTrack.currentTime >= this.currentTrack.duration - this.overlapSeconds) {
			this.previousTrack = this.currentTrack;
			this.currentTrackIndex = (utilities.getRandomIntInclusive(1, this.tracks.length - 1) + this.currentTrackIndex) % this.tracks.length;
			this.currentTrack = this.tracks[this.currentTrackIndex];
			if(this._playing)
				this.currentTrack.play();
		}
		if(this.previousTrack && this.previousTrack.currentTime >= this.previousTrack.duration) {
			this.previousTrack.currentTime = 0;
			this.previousTrack.pause();
			this.previousTrack = undefined;
		}
	}

	get volume() {
		return this.tracks[0].volume;
	}

	set volume(val) {
		for(let c = 0; c < this.tracks.length; c++) {
			this.tracks[c].volume = val;
		}
	}
}

module.exports = TrackShuffler;