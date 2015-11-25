var Observ = require("observ")
var extend = require("xtend")

var blackList = {
    "length": "Clashes with `Function.prototype.length`.\n",
    "name": "Clashes with `Function.prototype.name`.\n",
    "_diff": "_diff is reserved key of observ-struct.\n",
    "_type": "_type is reserved key of observ-struct.\n",
    "_version": "_version is reserved key of observ-struct.\n"
}

function checkBlackList (key) {
    if (blackList.hasOwnProperty(key)) {
        throw new Error("cannot create an observ-struct " +
            "with a key named '" + key + "'.\n" +
            blackList[key]);
    }
}

var NO_TRANSACTION = {}

function setNonEnumerable(object, key, value) {
    Object.defineProperty(object, key, {
        value: value,
        writable: true,
        configurable: true,
        enumerable: false
    })
}

/* ObservStruct := (Object<String, Observ<T>>) =>
    Object<String, Observ<T>> &
        Observ<Object<String, T> & {
            _diff: Object<String, Any>
        }>

*/
module.exports = ObservStruct

function ObservStruct(initialData) {

    var currentTransaction = NO_TRANSACTION
    function setState(value) {
        currentTransaction = value
        obs.set(value)
        currentTransaction = NO_TRANSACTION
    }

    var nestedTransaction = NO_TRANSACTION
    function setNestedState(key, value) {
        nestedTransaction = value;
        data[key].set(value);
        nestedTransaction = NO_TRANSACTION
    }

    var initial = {}
      , data    = extend(initialData)
      , obs     = Observ()

    Object.keys(data).forEach(add.bind(null, initial, data))

    obs.set(initial)

    function add (into, from, key) {
        checkBlackList(key)
        obs[key] = from[key]
        if (typeof obs[key] === "function") {
            from[key](nestedChange.bind(null, key))
            into[key] = from[key]()
        } else {
            into[key] = from[key]
        }
        return from[key]
    }

    function nestedChange (key, value) {
        if (nestedTransaction === value) {
            return
        }

        var state = extend(obs())
        state[key] = value
        var diff = {}
        diff[key] = value && value._diff ?
            value._diff : value

        setNonEnumerable(state, "_diff", diff)
        setState(state);
    }

    var _set = obs.set
    obs.set = function trackDiff(value) {
        if (currentTransaction === value) {
            return _set(value)
        }

        var newState = extend(value)
        setNonEnumerable(newState, "_diff", value)
        _set(newState)
    }

    obs(function (newValue) {
        if (currentTransaction === newValue) {
            return
        }

        Object.keys(newValue).forEach(function (key) {

            if (data.hasOwnProperty(key)) {
                if (typeof data[key] === "function" &&
                    data[key]() !== newValue[key]
                ) {
                    setNestedState(key, newValue[key])
                }
            } else {
                var extra = {}
                data[key] = add(extra, newValue, key)
                setState(extend(obs(), extra));
            }

        })
    })

    obs._type = "observ-struct"
    obs._version = "5"

    return obs
}
