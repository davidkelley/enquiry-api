import AWS from 'aws-sdk';
import Joi from 'joi';

import { DynamoDB, OK, ERROR } from 'node-lambda-events';
import { AWS_REGION, USER_POOL_ID, MESSAGES_TABLE } from '../global';
import Messenger from './messenger';

const QUERY = 'query';

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
    if (record.type !== 'CREATE') {
      return true;
    } else {
      const message = record.newImage;
      const messages = await this.thread(message.conversation_id);
      const partner = await this.partner(message.partner);
      const messenger = new Messenger({ messages, partner });
      await messenger.send();
    }
  }

  async partner(Username) {
    const attrs = {};
    const params = { Username, UserPoolId: USER_POOL_ID };
    const { UserAttributes } = await this.cognito(GET_USER, params);
    UserAttributes.each((obj) => { attrs[obj.Name] = obj.Value });
    return attrs;
  }

  async thread(id, from = 0) {
    const params = {
      TableName: MESSAGES_TABLE,
      KeyConditionExpression: 'conversation_id = :c AND sent_at > :f',
      ExpressionAttributeValues: { ':c': id, ':f': from },
    };
    const { Items } = await this.document(QUERY, params);
    return Items;
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

  document(op, params) {
    return new Promise((resolve, reject) => {
      const client = AWS.DynamoDB.DocumentClient({
        service: new AWS.DynamoDB({ region: AWS_REGION }),
      });
      client[op](params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }
});
