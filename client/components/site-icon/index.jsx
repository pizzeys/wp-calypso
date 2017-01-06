/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { get } from 'lodash';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Spinner from 'components/spinner';
import QuerySites from 'components/data/query-sites';
import { getSite } from 'state/sites/selectors';
import { getSiteIconUrl, getSiteIconId, isTransientMedia } from 'state/selectors';
import resizeImageUrl from 'lib/resize-image-url';
import Gridicon from 'components/gridicon';

const SiteIcon = React.createClass( {
	getDefaultProps() {
		return {
			// Cache a larger image so there's no need to download different
			// assets to display the site icons in different contexts.
			imgSize: 120,
			size: 32
		};
	},

	propTypes: {
		imgSize: React.PropTypes.number,
		siteId: React.PropTypes.number,
		site: React.PropTypes.object,
		size: React.PropTypes.number,
		iconUrl: React.PropTypes.string,
		isTransientIcon: React.PropTypes.bool
	},

	render() {
		const { site, siteId, iconUrl, imgSize, isTransientIcon } = this.props;

		const iconSrc = resizeImageUrl( iconUrl, imgSize );

		const iconClasses = classNames( {
			'site-icon': true,
			'is-blank': ! iconSrc,
			'is-transient': isTransientIcon
		} );

		// Size inline styles
		const style = {
			height: this.props.size,
			width: this.props.size,
			lineHeight: this.props.size + 'px',
			fontSize: this.props.size + 'px'
		};

		return (
			<div className={ iconClasses } style={ style }>
				{ ! site && siteId > 0 && <QuerySites siteId={ siteId } /> }
				{ iconSrc
					? <img className="site-icon__img" src={ iconSrc } />
					: <Gridicon icon="globe" size={ Math.round( this.props.size / 1.3 ) } />
				}
				{ isTransientIcon && <Spinner /> }
			</div>
		);
	}
} );

export default connect( ( state, { site, siteId, imgSize } ) => {
	// Always prefer site from Redux state if available
	const stateSite = getSite( state, get( site, 'ID', siteId ) );

	// Until all sites state is within Redux, we provide compatibility in cases
	// where sites-list object is passed to use the icon.img property as URL.
	// Specifically this shows icon for non-selected <SiteSelector /> sites,
	// since only the selected site is currently received into state.
	if ( ! stateSite ) {
		return {
			iconUrl: get( site, 'icon.img' )
		};
	}

	const iconId = getSiteIconId( state, stateSite.ID );

	return {
		site: stateSite,
		isTransientIcon: isTransientMedia( state, stateSite.ID, iconId ),
		iconUrl: getSiteIconUrl( state, stateSite.ID, imgSize )
	};
} )( SiteIcon );
