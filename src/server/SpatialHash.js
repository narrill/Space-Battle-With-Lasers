const Grid = require('./Map.js');
const SWBLTypedGroup = require('./SWBLTypedGroup.js');

// const getMinMaxFromObject = (object, dt) => {
//   const min = [];
//   const max = [];
//   if (object.type === 'hitscan') {
//     min[0] = (object.startX < object.endX) ? object.startX : object.endX;
//     min[1] = (object.startY < object.endY) ? object.startY : object.endY;
//     max[0] = (object.startX > object.endX) ? object.startX : object.endX;
//     max[1] = (object.startY > object.endY) ? object.startY : object.endY;
//   } else if (object.type === 'radial') {
//     const vel = Math.abs(object.velocity) * dt;
//     min[0] = object.x - object.radius - vel;
//     min[1] = object.y - object.radius - vel;
//     max[0] = object.x + object.radius + vel;
//     max[1] = object.y + object.radius + vel;
//   } else {
//     const velX = (object.velocityX) ? Math.abs(object.velocityX) * dt : 0;
//     const velY = (object.velocityY) ? Math.abs(object.velocityY) * dt : 0;
//     min[0] = object.x - object.destructible.radius - velX;
//     min[1] = object.y - object.destructible.radius - velY;
//     max[0] = object.x + object.destructible.radius + velX;
//     max[1] = object.y + object.destructible.radius + velY;
//   }
//   return [min, max];
// };

class SpatialHash {
  constructor() {
    this.tiles = [];
    this.map = new Grid();
  }

  processReportQueue(reportQueue) {
    const map = new Grid(
      reportQueue.min[0] - 2,
      reportQueue.min[1] - 2,
      (reportQueue.max[0] - reportQueue.min[0]) + 4,
      (reportQueue.max[1] - reportQueue.min[1]) + 4,
      3000,
    );
    // const taSize = map.length;
    this.map = map;
    this.clear();

    let item;
    let currentIndex;
    let tiles = [];
    const taa = this.tiles;
    const p21d = map.posTo1dIndex.bind(map);
    const rqArray = reportQueue.objects;

    for (let c = 0, counter = reportQueue.count; c < counter; c++) {
      item = rqArray[c];
      // const minMax = getMinMaxFromObject(item, dt);
      // const min = minMax[0];
      // const max = minMax[1];
      tiles = [];
      if (item.x && item.y) {
        currentIndex = p21d([item.x, item.y]);
        tiles[0] = currentIndex;
        taa[currentIndex][item.type].push(item);
      }
      // currentIndex = p21d([min[0], min[1]]);
      // if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
      //   tiles[1] = currentIndex;
      //   taa[currentIndex][item.type].push(item);
      // }
      // currentIndex = p21d([min[0], max[1]]);
      // if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
      //   tiles[2] = currentIndex;
      //   taa[currentIndex][item.type].push(item);
      // }
      // currentIndex = p21d([max[0], min[1]]);
      // if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
      //   tiles[3] = currentIndex;
      //   taa[currentIndex][item.type].push(item);
      // }
      // currentIndex = p21d([max[0], max[1]]);
      // if (currentIndex <= taSize && currentIndex >= 0 && !tiles.includes(currentIndex)) {
      //   tiles[4] = currentIndex;
      //   taa[currentIndex][item.type].push(item);
      // }
    }
  }

  clear() {
    const taSize = this.map.length;
    for (let c = 0; c <= taSize; c++) {
      // console.log('adding tile '+c);
      if (c >= this.tiles.length) {
        this.tiles.push(new SWBLTypedGroup());
      } else {
        this.tiles[c].clear();
      }
    }
  }

  fetch(pos, radius, objectList = new SWBLTypedGroup()) {
    const min = [pos[0] - radius, pos[1] - radius];
    const max = [pos[0] + radius, pos[1] + radius];

    this.map.iterate(min, max, (tileIndex) => {
      const theTile = this.tiles[tileIndex];
      if (theTile) {
        const keys = Object.keys(objectList);
        for (let n = 0; n < keys.length; n++) {
          const key = keys[n];
          for (let c = 0; c < theTile[key].length; c++) {
            objectList[key].push(theTile[key][c]);
          }
        }
      }
    });

    return objectList;
  }
}

module.exports = SpatialHash;
