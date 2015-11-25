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

function ObservStruct(struct) {
    var keys = Object.keys(struct)

    var initialState = {}

    var currentTransaction = NO_TRANSACTION
    function setState(value) {
      currentTransaction = value
      obs.set(value)
      currentTransaction = NO_TRANSACTION
    }

    var nestedTransaction = NO_TRANSACTION
    function setNestedState(key, value) {
      nestedTransaction = value;
      struct[key].set(value);
      nestedTransaction = NO_TRANSACTION
    }

    keys.forEach(function (key) {
        checkBlackList(key)
        initialState[key] = typeof struct[key] === "function" ?
            struct[key]() : struct[key]
    })

    var obs = Observ(initialState)
    keys.forEach(function (key) {
        obs[key] = struct[key]

        if (typeof struct[key] === "function") {
            struct[key](function (value) {
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
            })
        }
    })
    var _set = obs.set
    obs.set = function trackDiff(value) {
        if (currentTransaction === value) {
            return _set(value)
        }

        var newState = extend(value)
        setNonEnumerable(newState, "_diff", value)
        _set(newState)
    }

    obs(function (newState) {
        if (currentTransaction === newState) {
            return
        }

        Object.keys(newState).forEach(function (key) {

            if (struct.hasOwnProperty(key)) {
              if (typeof struct[key] === "function" &&
                  struct[key]() !== newState[key]
              ) {
                  setNestedState(key, newState[key])
              }
            } else {
              checkBlackList(key)
              obs[key] = newState[key]
              var state = extend(obs())
              state[key] = struct[key] = typeof newState[key] === "function" ?
                  newState[key]() : newState[key]
              setState(state);
            }
        })
    })

    obs._type = "observ-struct"
    obs._version = "5"

    return obs
}
