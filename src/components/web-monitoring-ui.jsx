import PropTypes from 'prop-types';
import React from 'react';
import AriaModal from 'react-aria-modal';
import {BrowserRouter as Router, Route, Switch} from 'react-router-dom';
import bindComponent from '../scripts/bind-component';
import WebMonitoringApi from '../services/web-monitoring-api';
import WebMonitoringDb from '../services/web-monitoring-db';
import LoginForm from './login-form';
import NavBar from './nav-bar';
import PageDetails from './page-details';
import PageList from './page-list';

const configuration = window.webMonitoringConfig;

const api = new WebMonitoringDb({
  url: configuration.WEB_MONITORING_DB_URL
});

const localApi = new WebMonitoringApi(api);

/**
 * WebMonitoringUi represents the root container for the app. It also maintains
 * a top-level lsit of pages to share across the app. We do this here instead
 * of via caching in the web-monitoring-db API because we want any part of the
 * app that interates through pages to iterate through the same set of pages
 * with the same filters and conditions.
 *
 * @class WebMonitoringUi
 * @extends {React.Component}
 */
export default class WebMonitoringUi extends React.Component {
  constructor (props) {
    super(props);
    this.state = {pages: null, showLogin: false, user: null};
    this.showLogin = this.showLogin.bind(this);
    this.hideLogin = this.hideLogin.bind(this);
    this.afterLogin = this.afterLogin.bind(this);
    this.logOut = this.logOut.bind(this);
    this.loadPages = this.loadPages.bind(this);
  }

  showLogin () {
    this.setState({showLogin: true});
  }

  hideLogin () {
    this.setState({showLogin: false, user: api.userData});
  }

  afterLogin (user) {
    this.hideLogin();
    this.loadPages(false);
  }

  logOut () {
    api.logOut();
    this.setState({user: api.userData});
    this.loadPages(true);
  }

  loadPages (showAll) {
    api.isLoggedIn()
      .then(loggedIn => {
        if (showAll) {
          return api.getPages();
        }
        else if (loggedIn) {
          return localApi.getPagesForUser(api.userData.email)
            .catch(() => {
              // TODO: Handle 'user not found' in a better way
              // than just showing default list
              return api.getPages();
            });
        }
        else {
          return api.getPages();
        }
      })
      .then((pages) => {
        this.setState({pages});
      });
  }

  loadUser () {
    api.isLoggedIn()
      .then(loggedIn => {
        this.setState({user: api.userData});
      });
  }

  componentWillMount () {
    this.loadUser();
  }

  render () {
    const withData = bindComponent({pages: this.state.pages, user: this.state.user});
    const withDataAll = bindComponent({
      pages: this.state.pages,
      user: this.state.user,
      loadPages: this.loadPages,
      showAll: true,
    });
    const withDataMyDomains = bindComponent({
      pages: this.state.pages,
      user: this.state.user,
      loadPages: this.loadPages,
      showAll: false,
    });
    const modal = this.state.showLogin ? this.renderLoginDialog() : null;

    return (
      <div>
        <Router>
          <div id="application">
            <NavBar title="EDGI" user={this.state.user} showLogin={this.showLogin} logOut={this.logOut} />
            <Switch>
              <Route exact path="/" render={withDataAll(PageList)} />
              <Route exact path="/all" render={withDataAll(PageList)} />
              <Route exact path="/mydomains" render={withDataMyDomains(PageList)} />
              <Route path="/page/:pageId/:change?" render={withData(PageDetails)} />
            </Switch>
          </div>
        </Router>
        {modal}
      </div>
    );
  }

  renderLoginDialog () {
    return (
      <AriaModal
        titleText="Log in"
        onExit={this.hideLogin}
        applicationNode={document.getElementById('web-monitoring-ui-root')}
        dialogClass="dialog__body"
        underlayClass="dialog dialog__underlay"
        verticallyCenter={true}
      >
        <LoginForm cancelLogin={this.hideLogin} onLogin={this.afterLogin} />
      </AriaModal>
    );
  }

  getChildContext () {
    return {api, localApi};
  }
}

WebMonitoringUi.childContextTypes = {
  api: PropTypes.instanceOf(WebMonitoringDb),
  localApi: PropTypes.instanceOf(WebMonitoringApi)
};
