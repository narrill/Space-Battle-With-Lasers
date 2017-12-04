class ComponentContainer {
	constructor(component) {
		this._active = true;
		this._cmp = component;
	}

	clear() {
		this._active = false;
		this._cmp = null;
	}

	get active() {
		return this._active;
	}

	get component() {
		return this._cmp;
	}
}

class System {
	constructor() {
		this._components = [];
		this._collapsedComponents = [];
		this._indexById = {};
		this._freeIndices = [];
	}

	collapse() {
		this._collapsedComponents.length = 0;
		for(let c = 0; c < this._components.length; c++) {
			const cmpContainer = this._components[c];
			if(cmpContainer.active) {
				this._collapsedComponents.push(cmpContainer.component);
			}
		}
	}

	update(dt) {
		for(let c = 0; c < this._collapsedComponents.length; c++) {
			this._collapsedComponents[c].update(dt);
		}
	}

	add(component) {
		const container = new ComponentContainer(component);
		let index;
		if(this._freeIndices.length > 0) {
			index = this._freeIndices.pop();
			this._components[index] = container;
		}
		else {
			index = this._components.length;
			this._components.push(container);
		}
		this._indexById[component.id] = index;
	}

	remove(id) {
		const index = this._indexById[id];
		this._indexById[id] = null;
		this._components[index].clear();
		// Maybe add call to component.onDestroy
	}

	getById(id) {
		return this._components[this._indexById[id]].component;
	}
}

module.exports = System;