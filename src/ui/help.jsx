import React, { Component } from "react";
import { Alert, Modal, Tooltip, Button, Popover, OverlayTrigger, Row, Col, Table} from "react-bootstrap";
import Icon from './icon';

export default class Help extends Component {

  constructor(props) {
    super(props);
    this.state = { showModal: false, ...props };
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  render() {
    const sample = `
console.log("Hello !");
hull.asUser({ "id":"123" });
// hull.traits({ coconuts: 12 });
// hull.track("sample event");
    `;
    return (
      <div>
        <Button bsStyle="warning" bsSize="sm" clasName='btn-pill btn-rounded' onClick={this.open.bind(this)} > Help </Button>

        <Modal show={this.state.showModal} bsSize='large' onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title><div className='text-center'>Incoming Webhook Processor</div></Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={10} mdOffset={1}>
                <Row>
                  <Col xs={3} sm={2}>
                    <p>
                      <Icon name='calculator' responsive/>
                    </p>
                  </Col>
                  <Col xs={9} sm={10}>
                    <p>
                      <strong>This ship lets you process data coming from any incoming webhook</strong>, add & edit User and Account properties and emit new events.
                    </p>
                  </Col>
                </Row>

                <hr/>

                <Row>
                  <Col sm={8}>
                    <p><Icon name='compute' large/></p>
                    <p>On the <strong>Sidebar</strong>, Write Javascript code to manipulate data, call <code>hull.asUser()</code> to identify user and then <code>hull.traits()</code> and <code>hull.track()</code> to update his traits and emit new events. ES6 is supported. You can't use asynchronous code (only `request` method is available) and you can't use external libraries.</p>
                    <h6>Example: </h6>
                    <pre>
                      <small>
                        <code>{sample}</code>
                      </small>
                    </pre>
                    <p>
                      <small>
                        You have to call <a target="_blank" href="https://github.com/hull/hull-client-node#impersonating-a-user---clientasuser">asUser</a> method to provide user identity.<br/>
                        Invoking this method requires to pass as argument at least on of the following properties:<br/>
                        <code>external_id</code>, <code>anonymous_id</code>, <code>email</code>, <code>id (which is id in hull)</code>.
                      </small>
                    </p>
                    <p>
                      <small>
                        You can apply <a target="_blank" href="https://github.com/hull/hull-client-node#usertraitsproperties-context">Traits operations</a>.
                      </small>
                    </p>
                    <p>
                      <small>
                        You can emit up to 10 events with <a target="_blank" href="https://github.com/hull/hull-client-node#usertrackevent-props-context">hull.track()</a>.
                      </small>
                    </p>
                  </Col>
                  <Col sm={4}>
                    <Col sm={12}>
                      <p><Icon name='rocker' large/></p>
                      <p>
                        On the <strong>left</strong>, is last received webhook request with the following properties:
                        <strong>body</strong>, <strong>headers</strong>, <strong>ip</strong>, <strong>method</strong>, <strong>params</strong>, <strong>query</strong>
                      </p>
                      <p>
                        For preview you can choose one of last ten received webhooks from dropdown (select by date of receipt).
                      </p>
                    </Col>
                    <Col sm={12}>
                      <p><Icon name='punker' large/></p>
                      <p>On the <strong>right</strong>, a preview of the summary of the changes that would be applied to user/accounts and eventual logs and errors from the console</p>

                      <p>When you're satisfied with the result, click <strong>Save</strong></p>
                    </Col>
                  </Col>
                </Row>

                <hr/>

                <Row>
                  <Col sm={12}>
                    <h4>Variables and libraries you can access</h4>

                  </Col>
                </Row>
                <Table striped bordered condensed hover className='mt-1'>
                  <tbody>
                    <tr>
                      <td><code>ship</code></td>
                      <td><p><small>The Connectors's data. Can be used to store additional details.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.traits(properties, context)</code></td>
                      <td><p><small><a href="https://github.com/hull/hull-client-node#usertraitsproperties-context" target="_blank">Update User Traits</a>. Optionally define a context with a <code>source</code> key to save in a custom group</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.track('Event Name', properties)</code></td>
                      <td><p><small>Lets you <a href="https://github.com/hull/hull-client-node#usertrackevent-props-context" target="_blank"> generate new Events</a> for the user.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(claims)</code></td>
                      <td><p><small>A method to link the Account claimed to this User. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.account(claims).traits(properties, context)</code></td>
                      <td><p><small>A method to Update Account Traits. If <code>claims</code> is defined, the claimed Account will be created/updated and linked to the User, else if <code>claims</code> is <code>null</code>, the Account belonging to this User will be updated. Optionally define a <code>context</code> with a <code>source</code> key to save in a custom group. </small></p></td>
                    </tr>

                    <tr>
                      <td><code>hull.asUser(userIdentity)</code></td>
                      <td><p><small>A method to provide user's <a href="https://github.com/hull/hull-client-node#impersonating-a-user---clientasuser" target="_blank">identity</a>. Every invocation will override previous one.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>body</code></td>
                      <td><p><small>The Webhook's Body</small></p></td>
                    </tr>

                    <tr>
                      <td><code>headers</code></td>
                      <td><p><small>The Webhook's Headers</small></p></td>
                    </tr>

                    <tr>
                      <td><code>cookies</code></td>
                      <td><p><small>The Webhook's Cookies</small></p></td>
                    </tr>

                    <tr>
                      <td><code>ip</code></td>
                      <td><p><small>The webhook's ip</small></p></td>
                    </tr>

                    <tr>
                      <td><code>method</code></td>
                      <td><p><small>The Webhook's Method</small></p></td>
                    </tr>

                    <tr>
                      <td><code>params</code></td>
                      <td><p><small>The Webhook's Params</small></p></td>
                    </tr>

                    <tr>
                      <td><code>query</code></td>
                      <td><p><small>The Webhook's Query</small></p></td>
                    </tr>

                    <tr>
                      <td><code>request(options, callback)</code></td>
                      <td><p><small>The <a href="https://github.com/request/request" target='_blank'>request</a> library. Jump to <strong>Instructions</strong> page to find out how to use it.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>moment()</code></td>
                      <td><p><small>The <a href="http://momentjs.com/" target='_blank'>Moment.js</a> library.</small></p></td>
                    </tr>

                    <tr>
                      <td><code>_</code></td>
                      <td><p><small>The <a href="https://lodash.com/" target='_blank'>lodash</a> library.</small></p></td>
                    </tr>
                  </tbody>
                </Table>
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
