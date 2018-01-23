Object.prototype.optionalBind = function(prop) {
	if(this[prop])
		this[prop] = this[prop].bind(this);
};