const Serializer = require('./Serializer.js');
const Deserializer = require('./Deserializer.js');

class NestedTestClass {
	constructor({arr, b, c}) {
		this.arr = arr;
		this.b = b;
		this.c = c;
	}
}

NestedTestClass.serializableProperties = [
	{key:'arr', type:'Uint8', isArray:true},
	{key:'b', type:'Uint8'},
	{key:'c', type:'Uint16'}
];

class TestClass {
	constructor({arr, b, c, nested}) {
		this.arr = arr;
		this.b = b;
		this.c = c;
		this.nested = nested;
	}
}

TestClass.serializableProperties = [
	{key:'arr', type:'Uint8', isArray:true},
	{key:'b', type:'Uint8'},
	{key:'c', type:'Uint16'},
	{key:'nested', type:NestedTestClass}
];

const test = new TestClass({
	arr: [1.5, 2, 3],
	b: 4,
	c: 5,
	nested: new NestedTestClass({
		arr: [6, 7, 8],
		b: 8,
		c: 9
	})
});

console.log(`Initial value`);
console.log(test);

const serializer = new Serializer();
serializer.push(TestClass, test);
const buf = serializer.write();
console.log('');
console.log(buf);
const deserializer = new Deserializer(buf);
const serializedTest = deserializer.read(TestClass);

console.log(`\nPost-serialization value`);
console.log(serializedTest);