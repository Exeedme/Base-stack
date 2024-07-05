import { env } from '../config/env';
import { EnvName } from '../enums/environments';

const blacklist = ['key', 'password'];

/**
 * Method that sanitizes an object, removing the keys present in the blacklist.
 * @param object
 */
export default function (object: any): any {
  const newObject = { ...object };
  if (env.NODE_ENV === EnvName.DEVELOPMENT) {
    return newObject;
  }

  for (const word of blacklist) {
    if (word in newObject) {
      newObject[word] = '---REDACTED---';
    }
  }

  return newObject;
}
