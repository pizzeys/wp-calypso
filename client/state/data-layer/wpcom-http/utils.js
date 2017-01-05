/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Returns response data from an HTTP request success action if available
 *
 * @param {Object} action may contain HTTP response data
 * @returns {any|null} response data if available
 */
export const getData = action => get( action, 'meta.dataLayer.data', null );

/**
 * Returns error data from an HTTP request failure action if available
 *
 * @param {Object} action may contain HTTP response error data
 * @returns {any|null} error data if available
 */
export const getError = action => get( action, 'meta.dataLayer.error', null );

/**
 * Dispatches to appropriate function based on HTTP request meta
 *
 * @see state/data-layer/wpcom-http/actions#fetch creates HTTP requests
 *
 * When the WPCOM HTTP data layer handles requests it will add
 * response data and errors to a meta property on the given success
 * and error handling actions.
 *
 * This function accepts three functions as the initiator, success,
 * and error handlers for actions and it will call the appropriate
 * one based on the stored meta.
 *
 * If both error and response data is available this will call the
 * error handler in preference over the success handler, but the
 * response data will also still be available through the action meta.
 *
 * The functions should conform to the following type signatures:
 *   initiator :: ReduxStore -> Action -> Dispatcher (middleware signature)
 *   onSuccess :: ReduxStore -> Action -> Dispatcher -> ResponseData
 *   onError   :: ReduxStore -> Action -> Dispatcher -> ErrorData
 *
 * @param {Function} initiator called if action lacks response meta; should create HTTP request
 * @param {Function} onSuccess called if the action meta includes response data
 * @param {Function} onError called if the action meta includes error data
 * @returns {any} please ignore return values, they are undefined
 */
export const dispatchRequest = ( initiator, onSuccess, onError ) => ( store, action, next ) => {
	const error = getError( action );
	if ( error ) {
		return onError( store, action, next, error );
	}

	const data = getData( action );
	if ( data ) {
		return onSuccess( store, action, next, data );
	}

	return initiator( store, action, next );
};