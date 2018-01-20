'use strict'

const reusify = require('reusify')

function fast (functions, context) {
  const holder = reusify(Holder)
  functions = functions.map(fn => fn.bind(context))

  return function _fast (iterator, value, done) {
    var instance = holder.get()
    instance.iterator = iterator
    instance.functions = functions
    instance.functionsLen = functions.length
    instance.context = context
    instance.done = done
    instance.i = 0
    instance.value = value
    instance._next()
  }

  function Holder () {
    this.next = null
    this.value = null
    this.functions = null
    this.functionsLen = 0
    this.context = null
    this.done = null
    this.iterator = null
    this.i = 0

    var that = this

    this._next = function () {
      if (this.i === this.functionsLen) {
        this.done.call(this.context, null, this.value)
        holder.release(this)
        return
      }
      var res = this.iterator(this.functions[this.i++], this.value, this._done)
      if (res && typeof res.then === 'function') {
        res.then(this._resolve)
           .catch(this._reject)
      }
    }

    this._done = function (err, value) {
      if (err) {
        that.done.call(that.context, err, that.value)
        holder.release(that)
        return
      }
      if (value !== undefined) that.value = value
      that._next()
    }

    this._resolve = function (value) {
      if (value !== undefined) that.value = value
      that._next()
    }

    this._reject = function (err) {
      that.done.call(that.context, err, that.value)
      holder.release(that)
    }
  }
}

module.exports = fast
