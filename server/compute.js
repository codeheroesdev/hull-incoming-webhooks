import vm from "vm";
import _ from "lodash";
import moment from "moment";
import urijs from "urijs";
import raven from "raven";
import deepFreeze from "deep-freeze";
import request from "request";
import Promise from "bluebird";

function applyUtils(sandbox: Object = {}) {
  const lodash = _.functions(_).reduce((l, key) => {
    l[key] = (...args) => _[key](...args);
    return l;
  }, {});

  sandbox.moment = deepFreeze((...args) => { return moment(...args); });
  sandbox.urijs = deepFreeze((...args) => { return urijs(...args); });
  sandbox._ = deepFreeze(lodash);
}


const sandboxes = {};
function getSandbox(ship) {
  const s = sandboxes[ship.id];
  if (!s) sandboxes[ship.id] = vm.createContext({});
  return sandboxes[ship.id];
}

module.exports = function compute(message: Object, ship: Object = {}, client: Object = {}, options: Object = {}) {
  const { preview } = options;
  const { private_settings = {} } = ship;
  const { code = "", sentry_dsn: sentryDsn } = private_settings;

  const sandbox = getSandbox(ship);
  Object.keys(message).forEach(userKey => sandbox[userKey] = message[userKey]);

  sandbox.account_segments = message.account_segments || [];
  sandbox.ship = ship;
  sandbox.payload = {};

  applyUtils(sandbox);

  let userIdentity = {};
  let tracks = [];
  const userTraits = [];
  const accountTraits = [];
  let accountClaims = {};
  const logs = [];
  const errors = [];
  let isAsync = false;

  sandbox.results = [];
  sandbox.errors = errors;
  sandbox.logs = logs;

  const track = (eventName, properties = {}, context = {}) => {
    if (eventName) tracks.push({ eventName, properties, context });
  };

  const traits = (properties = {}, context = {}) => {
    userTraits.push({ properties, context });
  };

  const asUser = (userIdent = {}) => {
    try {
      client.asUser(userIdent);
      userIdentity = userIdent
    } catch (err) {
      errors.push(err);
    }
  };

  sandbox.track = track;
  sandbox.traits = traits;
  sandbox.asUser = asUser;

  sandbox.hull = {
    account: (claims = null) => {
      if (claims) {
        accountClaims = claims;
      }
      return {
        traits: (properties = {}, context = {}) => {
          accountTraits.push({ properties, context });
        }
      };
    },
    traits,
    track,
    asUser
  };

  sandbox.request = (opts, callback) => {
    isAsync = true;
    return request.defaults({ timeout: 3000 })(opts, (error, response, body) => {
      try {
        callback(error, response, body);
      } catch (err) {
        errors.push(err.toString());
      }
    });
  };

  function log(...args) {
    logs.push(args);
  }

  function debug(...args) {
    // Only show debug logs in preview mode
    if (options.preview) {
      logs.push(args);
    }
  }

  function logError(...args) {
    errors.push(args);
  }
  sandbox.console = { log, warn: log, error: logError, debug };

  sandbox.captureException = function captureException(e) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.setExtraContext(message);
      client.captureException(e);
    }
  };

  sandbox.captureMessage = function captureMessage(msg) {
    if (sentryDsn) {
      const client = new raven.Client(sentryDsn);
      client.captureMessage(msg);
    }
  };

  try {
    const script = new vm.Script(`
      try {
        results.push(function() {
          "use strict";
          ${code}
        }());
      } catch (err) {
        errors.push(err.toString());
        captureException(err);
      }`);
    script.runInContext(sandbox);
  } catch (err) {
    errors.push(err.toString());
    sandbox.captureException(err);
  }

  if (isAsync && !_.some(_.compact(sandbox.results), (r) => _.isFunction(r.then))) {
    errors.push("It seems you’re using 'request' which is asynchronous.");
    errors.push("You need to return a 'new Promise' and 'resolve' or 'reject' it in you 'request' callback.");
  }

  if (_.isEmpty(userIdentity)) {
    errors.push("You have to call asUser at least once to provide user identity");
  }

  return Promise.all(sandbox.results)
  .catch((err) => {
    errors.push(err.toString());
    sandbox.captureException(err);
  })
  .then(() => {
    if (preview && tracks.length > 10) {
      logs.unshift([tracks]);
      logs.unshift([`You're trying to send ${tracks.length} calls at a time. We will only process the first 10`]);
      logs.unshift(["You can't send more than 10 tracking calls in one batch."]);
      tracks = _.slice(tracks, 0, 10);
    }

    return {
      userIdentity,
      logs,
      errors,
      changes: _.map(userTraits, trait => trait.properties),
      events: tracks,
      payload: sandbox.payload,
      accountClaims
    };
  });
};
