import { describe, expect, test } from '@jest/globals';
import { battleMachine } from '../src';
import { AnyMachineSnapshot, createActor } from 'xstate';
import 'isomorphic-fetch';

function getNextEvents(snapshot: AnyMachineSnapshot) {
  // @ts-ignore
  return [...new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])];
}

describe('Simple xstate test', () => {
  test('Testing 1', () => {

    const warActor = createActor(battleMachine);
    warActor.subscribe((state) => {
      console.log(
        'tile1:',
        state.context.tiles['1'].troopCount,
        ' tile2: ',
        state.context.tiles['2'].troopCount
      );
    });

    warActor.start();
    warActor.send({ type: 'start-battle' });
    warActor.send({ type: 'attack', tile1: '1', tile2: '2' });

    console.log(getNextEvents(warActor.getSnapshot()));
  });

  test.only('Testing 2', async () => {
    const response = await fetch('http://localhost:3000/api/conquest', {
      method: 'POST',
    });
    console.log(await response.text());
  });
});
