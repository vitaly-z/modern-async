
import { expect, test } from '@jest/globals'
import PriorityMutex from './PriorityMutex'
import preciseWait from './preciseWait'
import _ from 'lodash'

test('PriorityMutex', async () => {
  const unit = 30
  const start = new Date().getTime()
  const mutex = new PriorityMutex(1)
  expect(mutex.locked).toBe(false)
  expect(mutex.pending).toBe(0)
  const promises = []
  const callCount = {}
  for (const x of _.range(3)) {
    callCount[x] = 0
    const p = mutex.exec(async () => {
      callCount[x] += 1
      await preciseWait(unit)
    }, 10)
    expect(p).toBeInstanceOf(Promise)
    promises.push(p)
  }
  expect(promises.length).toBe(3)
  expect(mutex.locked).toBe(true)
  expect(mutex.pending).toBe(2)
  expect(callCount[0]).toBe(1)
  expect(callCount[1]).toBe(0)
  expect(callCount[2]).toBe(0)
  await promises[0]
  expect(mutex.locked).toBe(true)
  expect(mutex.pending).toBe(1)
  expect(callCount[0]).toBe(1)
  expect(callCount[1]).toBe(1)
  expect(callCount[2]).toBe(0)
  let now = new Date().getTime()
  expect(now - start).toBeGreaterThanOrEqual(unit * 1)
  expect(now - start).toBeLessThan(unit * 1 * 3)
  await promises[1]
  expect(mutex.locked).toBe(true)
  expect(mutex.pending).toBe(0)
  expect(callCount[0]).toBe(1)
  expect(callCount[1]).toBe(1)
  expect(callCount[2]).toBe(1)
  now = new Date().getTime()
  expect(now - start).toBeGreaterThanOrEqual(unit * 2)
  expect(now - start).toBeLessThan(unit * 2 * 3)
  await promises[2]
  expect(mutex.locked).toBe(false)
  expect(mutex.pending).toBe(0)
  now = new Date().getTime()
  expect(now - start).toBeGreaterThanOrEqual(unit * 3)
  expect(now - start).toBeLessThan(unit * 3 * 3)
})
