/* global describe, it, beforeEach, afterEach */

import Minihull from "minihull";
import axios from "axios";
import assert from "assert";
import jwt from "jwt-simple";
import _ from "lodash";
import bootstrap from "./support/bootstrap";

describe("Connector for webhooks endpoint", function test() {
  let minihull;
  let server;

  const private_settings = {
    code: "hull.asUser({ \"id\": req.body.user.id });\n\
    hull.traits(req.body.user.traits);\n\ \
    hull.track(req.body.user.eventName);"
  };

  beforeEach((done) => {
    minihull = new Minihull();
    server = bootstrap();
    minihull.listen(8001);
    minihull.stubConnector({ id: "123456789012345678901234", private_settings });
    minihull.stubSegments([]);

    setTimeout(() => {
      done();
    }, 1500);
  });

  afterEach(() => {
    minihull.close();
    server.close();
  });

  const config = {
    organization: "localhost:8001",
    ship: "123456789012345678901234",
    secret: "1234"
  };
  const token = jwt.encode(config, "1234");

  it("should update user when webhook is sent", (done) => {
    let firstCheck = false;
    let secondCheck = false;

    axios.post(`http://localhost:8000/webhooks/123456789012345678901234?token=${token}`, {
      user: {
        id: "123",
        eventName: "test",
        traits: {
          customerioid: "321"
        }
      }
    }).then(() => {
      minihull.on("incoming.request", (req) => {
        const batch = req.body.batch;

        batch.forEach(incoming => {
          if (incoming.type === "traits") {
            assert.equal(_.get(incoming.body, "traits/customerioid"), "321");
            firstCheck = true;
          } else {
            assert.equal(incoming.body.event, "test");
            secondCheck = true;
          }
        });
      });

      setTimeout(() => {
        if (!firstCheck) {
          done(Error("first check not satisfied"))
        } else if (!secondCheck) {
          done(Error("second check not satisfied"))
        } else {
          done();
        }
      }, 1500);
    });
  });
});