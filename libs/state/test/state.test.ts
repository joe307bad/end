import { describe, expect, test } from '@jest/globals';
import { feedbackActor } from '../src';

describe('Simple xstate test', () => {
  test('Testing 1', () => {
    feedbackActor.subscribe((state) => {
      console.log(state.value);
      console.log(state.context);
    });

    feedbackActor.start();
    feedbackActor.send({type: "start-battle"})
    feedbackActor.send({type: "start-battle"})
  });
});
