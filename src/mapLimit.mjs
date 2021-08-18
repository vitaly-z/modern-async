
import Queue from './Queue.mjs'
import assert from 'nanoassert'

/**
 * Produces a new collection of values by mapping each value in `iterable` through the `iteratee` function.
 *
 * Multiple calls to `iteratee` will be performed in parallel, up to the concurrency limit.
 *
 * If any of the calls to iteratee throws an exception the returned promise will be rejected and the remaining
 * pending tasks will be cancelled.
 *
 * @param {Iterable} iterable An iterable object.
 * @param {Function} iteratee A function that will be called with each member of the iterable. It will receive
 * three arguments:
 *   * `value`: The current value to process
 *   * `index`: The index in the iterable. Will start from 0.
 *   * `iterable`: The iterable on which the operation is being performed.
 * @param {number} concurrency The number of times `iteratee` can be called concurrently.
 * @returns {Promise} A promise that will be resolved with an array containing all the mapped value,
 * or will be rejected if any of the calls to `iteratee` throws an exception.
 * @example
 * import { mapLimit, asyncRoot, sleep } from 'modern-async'
 *
 * asyncRoot(async () => {
 *   const array = [1, 2, 3]
 *   const result = await mapLimit(array, async (v) => {
 *     // these calls will be performed in parallel with a maximum of 2
 *     // concurrent calls
 *     await sleep(10) // waits 10ms
 *     return v * 2
 *   }, 2)
 *   console.log(result) // prints [2, 4, 6]
 *   // total processing time should be ~ 20ms
 * })
 */
async function mapLimit (iterable, iteratee, concurrency) {
  assert(typeof iteratee === 'function', 'iteratee must be a function')
  const queue = new Queue(concurrency)
  let running = []
  const it = iterable[Symbol.iterator]()
  let i = 0
  const results = []
  let exhausted = false
  while (true) {
    while (!exhausted && queue.running < queue.concurrency) {
      const index = i
      const itval = it.next()
      if (itval.done) {
        exhausted = true
        break
      }
      const el = itval.value
      const promise = queue.exec(async () => {
        try {
          return [index, 'resolved', await iteratee(el, index, iterable)]
        } catch (e) {
          return [index, 'rejected', e]
        }
      })
      running.push([index, promise])
      i += 1
    }
    if (exhausted && running.length === 0) {
      return results
    }
    const [index, state, result] = await Promise.race(running.map(([i, p]) => p))
    running = running.filter(([i, p]) => i !== index)
    if (state === 'resolved') {
      results[index] = result
    } else { // error
      throw result
    }
  }
}

export default mapLimit
