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
    var nestedTransaction  = NO_TRANSACTION

    var obs     = Observ()
      , initial = {}
      , data    = extend(initialData)

    Object.keys(data).forEach(initKey)
    obs.set(initial)

    var _set = obs.set
    obs.set = trackDiff

    obs(update)
    obs._type = "observ-struct"
    obs._version = "5"

    return obs

    function initKey (key) {
        checkBlackList(key)
        obs[key] = data[key]
        if (typeof obs[key] === "function") {
            data[key](nestedChange.bind(null, key))
            initial[key] = data[key]()
        } else {
            initial[key] = data[key]
        }
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
        currentTransaction = state
        obs.set(state)
        currentTransaction = NO_TRANSACTION
    }

    function trackDiff(value) {
        if (currentTransaction === value) {
            return _set(value)
        }

        var newState = {}
        Object.keys(value).forEach(function(key){
            newState[key] = typeof value[key] === "function" ?
                value[key]() : value[key]
        })
        setNonEnumerable(newState, "_diff", value)
        _set(newState)
    }

    function update (newValue) {
        if (currentTransaction === newValue) {
            return
        }

        Object.keys(newValue).forEach(function (key) {
            if (data.hasOwnProperty(key)) {
                if (typeof data[key] === "function" &&
                    data[key]() !== newValue[key]
                ) {
                    nestedTransaction = newValue[key];
                    data[key].set(newValue[key]);
                    nestedTransaction = NO_TRANSACTION
                }
            } else {
                checkBlackList(key)
                obs[key] = newValue[key]
                if (typeof newValue[key] === "function") {
                    nestedChange(key, newValue[key]())
                    nestedTransaction = newValue[key]();
                    newValue[key](nestedChange.bind(null, key))
                    nestedTransaction = NO_TRANSACTION
                }
                //obs[key] = data[key] = newValue[key]
                //if (typeof newValue[key] === "function") {
                    //console.log(key, "is fn")
                    //newValue[key](nestedChange.bind(null, key))
                    //nestedTransaction = newValue[key]();
                    //newValue[key].set(nestedTransaction);
                    //nestedTransaction = NO_TRANSACTION
                //}
            }
        })
    }

}
