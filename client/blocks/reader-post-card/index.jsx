/**
 * External Dependencies
 */
import React, { PropTypes } from 'react';
import { noop, truncate, trim, get } from 'lodash';
import classnames from 'classnames';
import ReactDom from 'react-dom';
import closest from 'component-closest';

/**
 * Internal Dependencies
 */
import Card from 'components/card';
import DisplayTypes from 'state/reader/posts/display-types';
import * as stats from 'reader/stats';
import ReaderPostActions from 'blocks/reader-post-actions';
import PostByline from './byline';
import GalleryPost from './gallery';
import PhotoPost from './photo';
import StandardPost from './standard';
import FollowButton from 'reader/follow-button';
import PostStoreActions from 'lib/feed-post-store/actions';
import DailyPostButton from 'blocks/daily-post-button';
import { isDailyPostChallengeOrPrompt } from 'blocks/daily-post-button/helper';
import { getSourceFollowUrl as getDiscoverFollowUrl, isDiscoverPost as isDiscover } from 'reader/discover/helper';
import DiscoverFollowButton from 'reader/discover/follow-button';

export default class ReaderPostCard extends React.Component {
	static propTypes = {
		post: PropTypes.object.isRequired,
		site: PropTypes.object,
		feed: PropTypes.object,
		isSelected: PropTypes.bool,
		onClick: PropTypes.func,
		onCommentClick: PropTypes.func,
		showPrimaryFollowButton: PropTypes.bool,
		originalPost: PropTypes.object, // used for Discover only
		useBetterExcerpt: PropTypes.bool,
		showSiteName: PropTypes.bool,
		followSource: PropTypes.string,
	};

	static defaultProps = {
		onClick: noop,
		onCommentClick: noop,
		isSelected: false,
		useBetterExcerpt: true
	};

	propagateCardClick = () => {
		// If we have an original post available (e.g. for a Discover pick), send the original post
		// to the full post view
		const postToOpen = this.props.originalPost ? this.props.originalPost : this.props.post;
		this.props.onClick( postToOpen );
	}

	handleCardClick = ( event ) => {
		const rootNode = ReactDom.findDOMNode( this ),
			selection = window.getSelection && window.getSelection();

		// if the click has modifier or was not primary, ignore it
		if ( event.button > 0 || event.metaKey || event.controlKey || event.shiftKey || event.altKey ) {
			if ( closest( event.target, '.reader-post-card__title-link', true, rootNode ) ) {
				stats.recordPermalinkClick( 'card_title_with_modifier', this.props.post );
			}
			return;
		}

		if ( closest( event.target, '.should-scroll', true, rootNode ) ) {
			setTimeout( function() {
				window.scrollTo( 0, 0 );
			}, 100 );
		}

		// declarative ignore
		if ( closest( event.target, '.ignore-click, [rel~=external]', true, rootNode ) ) {
			return;
		}

		// ignore clicks on anchors inside inline content
		if ( closest( event.target, 'a', true, rootNode ) && closest( event.target, '.reader-post-card__excerpt', true, rootNode ) ) {
			return;
		}

		// ignore clicks when highlighting text
		if ( selection && selection.toString() ) {
			return;
		}

		// programattic ignore
		if ( ! event.defaultPrevented ) { // some child handled it
			event.preventDefault();
			this.propagateCardClick();
		}
	}

	handlePhotoCardExpanded = () => {
		stats.recordTrackForPost( 'calypso_reader_photo_expanded', this.props.post );

		// Record page view
		PostStoreActions.markSeen( this.props.post );
		stats.recordTrackForPost( 'calypso_reader_article_opened', this.props.post );
	}

	render() {
		const {
			post,
			originalPost,
			site,
			feed,
			onCommentClick,
			showPrimaryFollowButton,
			isSelected,
			useBetterExcerpt,
			showSiteName,
			followSource,
		} = this.props;

		const isPhotoPost = !! ( post.display_type & DisplayTypes.PHOTO_ONLY );
		const isGalleryPost = !! ( post.display_type & DisplayTypes.GALLERY );
		const isDiscoverPost = isDiscover( post );

		const classes = classnames( 'reader-post-card', {
			'has-thumbnail': !! post.canonical_media,
			'is-photo': isPhotoPost,
			'is-gallery': isGalleryPost,
			'is-selected': isSelected,
			'is-discover': isDiscoverPost
		} );

		const excerptAttribute = useBetterExcerpt && trim( post.better_excerpt ) ? 'better_excerpt' : 'excerpt';
		const title = truncate( post.title, { length: 140, separator: /,? +/ } );

		const discoverBlogName = get( post, 'discover_metadata.attribution.blog_name' );
		const discoverFollowButton = !! ( discoverBlogName )
			? <DiscoverFollowButton siteName={ discoverBlogName } followUrl={ getDiscoverFollowUrl( post ) } />
			: null;

		const readerPostActions = <ReaderPostActions
									post={ originalPost ? originalPost : post }
									visitUrl = { post.URL }
									showVisit={ true }
									showMenu={ true }
									showMenuFollow={ isDiscoverPost }
									onCommentClick={ onCommentClick }
									showEdit={ false }
									className="ignore-click"
									iconSize={ 18 } />;

		let readerPostCard;
		if ( isPhotoPost ) {
			const { height, width } = post.canonical_media;
			readerPostCard = <PhotoPost imageUri={ post.canonical_media.src }
								href={ post.URL }
								imageSize={ { height, width } }
								onExpanded={ this.handlePhotoCardExpanded }
								title={ title } >
					{ discoverFollowButton }
					{ readerPostActions }
				</PhotoPost>;
		} else if ( isGalleryPost ) {
			readerPostCard = <GalleryPost post={ post } title={ title } excerptAttribute={ excerptAttribute } >
					{ readerPostActions }
				</GalleryPost>;
		} else {
			readerPostCard = <StandardPost post={ post } title={ title } excerptAttribute={ excerptAttribute } >
					{ isDailyPostChallengeOrPrompt( post ) && <DailyPostButton post={ post } tagName="span" /> }
					{ discoverFollowButton }
					{ readerPostActions }
				</StandardPost>;
		}

		const followUrl = feed ? feed.feed_URL : post.site_URL;

		return (
			<Card className={ classes } onClick={ this.handleCardClick }>
				<PostByline post={ post } site={ site } feed={ feed } showSiteName={ showSiteName } />
				{ showPrimaryFollowButton && followUrl && <FollowButton siteUrl={ followUrl } followSource={ followSource } /> }
				{ readerPostCard }
				{ this.props.children }
			</Card>
		);
	}
}
