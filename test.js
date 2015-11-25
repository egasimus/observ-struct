Obj = require('.')

x = Obj({ foo: Obj({ bar: 1}) })

y = Obj({ baz: 2 })

z = x();
delete z.foo;
z.quux = y;
z.fnord = require('observ')(8);
x.set(z);

x(function(lol){ console.log("HEY", lol) })
console.log(1)
x.quux.set({top:'kek'})
console.log(2)
x.fnord.set(9001)
