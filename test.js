Obj = require('.')

x = Obj({ foo: Obj({ bar: 1}) })
x(function(lol){ console.log("HEY", lol) })
console.log("\n", 0)
x.foo.set({'top':'kek'})

y = Obj({ baz: 2, grok: Obj({cat:require('observ')('tax')})})

z = x();
//delete z.foo;
z.quux = y;
z.fnord = require('observ')(8);
console.log("\n", 1)
x.set(z);

console.log("\n", 2)
x.quux.grok.cat.set('dog')
x.quux.set({top:'kek'})

console.log("\n", 3)
x.fnord.set(9001)
