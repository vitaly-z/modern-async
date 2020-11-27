
import findIndexLimit from './findIndexLimit'

/**
 * Returns true if at least one element of an iterable pass a truth test and false otherwise.
 *
 * The iteratee will be run in parallel, up to a concurrency limit. If any truth test returns true
 * the promise is immediately resolved.
 *
 * Whenever a test returns true, all the remaining tasks will be cancelled as long
 * as they didn't started already. In case of exception in one of the iteratee calls the promise
 * returned by this function will be rejected with the exception and the remaining pending
 * tasks will also be cancelled. In the very specific case where a test returns true and an
 * already started task throws an exception that exception will be plainly ignored.
 *
 * @param {Iterable} iterable An iterable object.
 * @param {Function} iteratee A function that will be called with each member of the iterable. It will receive
 * three arguments:
 *   * value: The current value to process
 *   * index: The index in the iterable. Will start from 0.
 *   * iterable: The iterable on which the operation is being performed.
 * @param {number} concurrency The number of times iteratee can be called concurrently.
 * @returns {Promise} A promise that will be resolved to true if at least one value pass the truth test and false
 * if none of them do. That promise will be rejected if one of the truth test throws an exception.
 */
export default async function someLimit (iterable, iteratee, concurrency) {
  const index = await findIndexLimit(iterable, iteratee, concurrency)
  const result = index !== -1
  return result
}
