import mustache from 'mustache';

import partnerTemplate from './templates/partner.html';
import userTemplate from './templates/user.html';

export default class {
  construct({ messages, partner }) {
    this.messages = messages;
    this.partner = partner;
  }

  send() {
    return new Promise((resolve, reject) => {
      
    })
  }

  compile() {

  }
}
