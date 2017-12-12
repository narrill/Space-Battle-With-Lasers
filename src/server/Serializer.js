const { primitiveByteSizes, ARRAY_INDEX_TYPE } = require('./serializationConstants.js');

class Serializer {
  constructor() {
    this.reset();
  }

  reset() {
    this.cursor = 0;
    this.values = [];
  }

  // type should be an actual constructor object for non-primitives, not a string
  push(type, value, scaleFactor = 1) {
    const size = primitiveByteSizes[type];
    const isArray = Array.isArray(value);
    // Array - pushes length then recurses
    if (isArray) {
      this.push(ARRAY_INDEX_TYPE, value.length);
      for (let c = 0; c < value.length; c++) {
        this.push(type, value[c]);
      }
    } else if (!size) {
      // Object - recurses on serializable properties
      const serializableProperties = type.serializableProperties;
      for (let c = 0; c < serializableProperties.length; c++) {
        const property = serializableProperties[c];
        this.push(property.type, value[property.key], property.scaleFactor);
      }
    } else {
      // Primitive
      this.alignCursor(size);
      this.values.push({ type, offset: this.cursor, value: value * scaleFactor });
      this.cursor += size;
    }
  }

  alignCursor(alignment) {
    this.cursor += alignment - (this.cursor % alignment);
  }

  write() {
    const buf = new ArrayBuffer(this.cursor);
    const dataView = new DataView(buf);
    for (let c = 0; c < this.values.length; c++) {
      const valueInfo = this.values[c];
      dataView[`set${valueInfo.type}`](valueInfo.offset, valueInfo.value);
    }

    return buf;
  }
}

module.exports = Serializer;
