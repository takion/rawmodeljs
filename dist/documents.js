'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Document = exports.ValidationError = undefined;

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _defineProperty = require('babel-runtime/core-js/object/define-property');

var _defineProperty2 = _interopRequireDefault(_defineProperty);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeable = require('typeable');

var _deepEqual = require('deep-equal');

var _deepEqual2 = _interopRequireDefault(_deepEqual);

var _validatable = require('validatable');

var _utils = require('./utils');

var _schemas = require('./schemas');

var _fields = require('./fields');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
* A validation error class.
*/

class ValidationError extends Error {

  /*
  * Class constructor.
  */

  constructor() {
    let errors = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
    let message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'Fields validation failed';
    let code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 422;

    super();

    this.name = this.constructor.name;
    this.errors = errors;
    this.message = message;
    this.code = code;
  }
}

exports.ValidationError = ValidationError; /*
                                           * The core schema-based object class.
                                           */

class Document {

  /*
  * Class constructor.
  */

  constructor(schema) {
    let data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    Object.defineProperty(this, '$schema', { // schema instance
      value: schema
    });
    Object.defineProperty(this, '$parent', { // parent document instance
      value: parent
    });
    Object.defineProperty(this, '$root', { // root document instance
      get: () => this._getRootDocument()
    });
    Object.defineProperty(this, '$validator', { // validatable.js instance
      value: this._createValidator()
    });

    this._defineFields();
    this._populateFields(data);
  }

  /*
  * Loops up on the tree and returns the first document in the tree.
  */

  _getRootDocument() {
    let root = this;
    do {
      if (root.$parent) {
        root = root.$parent;
      } else {
        return root;
      }
    } while (true);
  }

  /*
  * Returns a new instance of validator.
  */

  _createValidator() {
    return new _validatable.Validator((0, _assign2.default)({}, this.$schema.validatorOptions, { context: this }));
  }

  /*
  * Defines class fields from schema.
  */

  _defineFields() {
    let fields = this.$schema.fields;


    for (let name in fields) {
      this._defineField(name);
    }
  }

  /*
  * Creates a new Field instance.
  */

  createField(name) {
    return new _fields.Field(this, name);
  }

  /*
  * Defines a schema field by name.
  */

  _defineField(name) {
    let field = this.createField(name);

    (0, _defineProperty2.default)(this, name, { // field definition
      get: () => field.value,
      set: v => field.value = v,
      enumerable: true,
      configurable: true
    });

    Object.defineProperty(this, `$${ name }`, { // field class instance definition
      value: field
    });
  }

  /*
  * Returns a value at path.
  */

  get() {
    for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
      keys[_key] = arguments[_key];
    }

    if ((0, _typeable.isArray)(keys[0])) {
      keys = keys[0];
    }

    return keys.reduce((a, b) => (a || {})[b], this);
  }

  /*
  * Returns `true` if field at path exists.
  */

  has() {
    return this.get(...arguments) !== undefined;
  }

  /*
  * Sets field values from the provided by data object.
  */

  populate() {
    let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    return this._populateFields(data);
  }

  /*
  * Sets field values from the provided by data object.
  */

  _populateFields() {
    let data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    data = (0, _utils.cloneData)(data);

    for (let name in data) {
      this._populateField(name, data[name]);
    }

    return this;
  }

  /*
  * Sets a value of a field by name.
  */

  _populateField(name, value) {
    if (!this.$schema.strict) {
      this[name] = value;
    } else {
      let names = (0, _keys2.default)(this.$schema.fields);
      let exists = names.indexOf(name) > -1;

      if (exists) {
        this[name] = value;
      }
    }
  }

  /*
  * Converts this class into serialized data object.
  */

  toObject() {
    let data = {};
    let names = (0, _keys2.default)(this);

    for (let name of names) {
      data[name] = this._serializeValue(this[name]);
    }

    return data;
  }

  /*
  * Serializes a value recursivelly and returns a serialized data object.
  */

  _serializeValue(value) {
    if (value && value.toObject) {
      return value.toObject();
    } else if (value && (0, _typeable.isArray)(value)) {
      return value.map(value => this._serializeValue(value));
    } else {
      return value;
    }
  }

  /*
  * Sets each document field to its default value.
  */

  reset() {
    let fields = this.$schema.fields;


    for (let name in fields) {
      this[`$${ name }`].reset();
    }

    return this;
  }

  /*
  * Removes all fileds values by setting them to `null`.
  */

  clear() {
    let fields = this.$schema.fields;


    for (let name in fields) {
      this[`$${ name }`].clear();
    }

    return this;
  }

  /*
  * Sets initial value of each document field to the current value of a field.
  */

  commit() {
    let fields = this.$schema.fields;


    for (let name in fields) {
      this[`$${ name }`].commit();
    }

    return this;
  }

  /*
  * Sets each document field to its initial value (value before last commit).
  */

  rollback() {
    let fields = this.$schema.fields;


    for (let name in fields) {
      this[`$${ name }`].rollback();
    }

    return this;
  }

  /*
  * Returns `true` when the `value` represents an object with the
  * same field values as the original document.
  */

  equals(value) {
    return (0, _deepEqual2.default)(this, value);
  }

  /*
  * Returns a new Document instance which is the exact copy of the original.
  */

  clone() {
    return new this.constructor(this.$schema, this.toObject());
  }

  /*
  * Returns a `true` if at least one field has been changed.
  */

  isChanged() {
    return (0, _keys2.default)(this.$schema.fields).some(name => {
      return this[`$${ name }`].isChanged();
    });
  }

  /*
  * Validates fields and returns errors.
  */

  validate() {
    var _this = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let errors = [];
      let fields = _this.$schema.fields;


      for (let path in fields) {
        let error = yield _this[`$${ path }`].validate();

        if (!(0, _typeable.isAbsent)(error)) {
          errors.push(error);
        }
      }

      return errors;
    })();
  }

  /*
  * Creates a new ValidationError instance.
  */

  createValidationError(errors) {
    return new ValidationError(errors);
  }

  /*
  * Validates fields and throws a ValidationError if not all fields are valid.
  */

  approve() {
    var _this2 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      let errors = yield _this2.validate();

      if ((0, _typeable.isPresent)(errors)) {
        throw _this2.createValidationError(errors);
      }

      return _this2;
    })();
  }

  /*
  * Returns `true` when all document fields are valid.
  */

  isValid() {
    var _this3 = this;

    return (0, _asyncToGenerator3.default)(function* () {
      return (0, _typeable.isAbsent)((yield _this3.validate()));
    })();
  }

}
exports.Document = Document;