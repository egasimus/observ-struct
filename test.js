Obj = require('.')

x = Obj({ foo: Obj({ bar: 1}) })
x(function(lol){ console.log("HEY", lol) })
console.log(0)
x.foo.set({'top':'kek'})

y = Obj({ baz: 2 })

z = x();
console.log(1)
delete z.foo;
z.quux = y;
z.fnord = require('observ')(8);

console.log(2)
x.set(z);

console.log(3)
x.quux.set({top:'kek'})

console.log(4)
x.fnord.set(9001)
