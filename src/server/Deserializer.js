const { primitiveByteSizes, ARRAY_INDEX_TYPE } = require('./serializationConstants.js');

class Deserializer {
  constructor(buf) {
    this.dataView = new DataView(buf);
    this.cursor = 0;
  }

  alignCursor(alignment) {
    this.cursor += alignment - (this.cursor % alignment);
  }

  // type should be an actual constructor object for non-primitives, not a string
  read(type, scaleFactor = 1) {
    const size = primitiveByteSizes[type];
    let val;
    // Primitive
    if(size) {
      this.alignCursor(size);
      val = this.dataView[`get${type}`](this.cursor) / scaleFactor;
      this.cursor += size;   
    }
    // Object
    else {
      const serializableProperties = type.serializableProperties;
      const opts = {};
      for(let c = 0; c < serializableProperties.length; c++) {
        const property = serializableProperties[c];
        if(property.isArray)
          opts[property.key] = this.readArray(property.type, property.scaleFactor);
        else
          opts[property.key] = this.read(property.type, property.scaleFactor);
      }
      val = new type(opts);
    }

    return val;
  }

  readArray(type, scaleFactor = 1) {
    const val = [];
    const length = this.read(ARRAY_INDEX_TYPE);
    for(let c = 0; c < length; c++)
      val.push(this.read(type, scaleFactor));
    return val;
  }
}

module.exports = Deserializer;