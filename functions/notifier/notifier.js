import AWS from 'aws-sdk';

import { DynamoDB, OK, ERROR } from 'node-lambda-events';
import { AWS_REGION, USER_POOL_ID } from '../global';

const PUBLISH = 'publish';

const GET_USER = 'adminGetUser';

export default DynamoDB.wrap(class extends DynamoDB {
  async perform() {
    try {
      await Promise.all(this.records.map(this.publish, this));
      this.respond(OK);
    } catch (err) {
      this.respond(ERROR, err.toString());
    }
  }

  async publish(record) {
    const message = record.newImage;
    let params = {};
    if (record.type !== 'CREATE') return true;
    if (message.origin === 'partner') {
      const text = 'You have a new enquiry. Login to see it.';
      const partner = await this.partner(message.partner);
      params = { PhoneNumber: partner.phone_number, Message: text };
    } else {
      const text = `Reply from ${message.partner}: ${message.message}`;
      params = { PhoneNumber: message.phone_number, Message: text };
    }
    return await this.sns(PUBLISH, params);
  }

  async partner(Username) {
    const attrs = {};
    const params = { Username, UserPoolId: USER_POOL_ID };
    const { UserAttributes } = await this.cognito(GET_USER, params);
    UserAttributes.each((obj) => { attrs[obj.Name] = obj.Value; });
    return attrs;
  }

  sns(op, params) {
    return new Promise((resolve, reject) => {
      const sns = new AWS.SNS({ region: AWS_REGION });
      sns[op](params, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }

  cognito(op, params) {
    return new Promise((resolve, reject) => {
      const cognito = new AWS.CognitoIdentityServiceProvider({ region: AWS_REGION });
      cognito[op](params, (err, resp) => {
        if (err) {
          reject(err);
        } else {
          resolve(resp);
        }
      });
    });
  }
});
