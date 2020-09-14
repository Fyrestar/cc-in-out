/**
 * @author Fyrestar <info@mevedia.com>
 */

function CookieConsent( options ) {

	// https://github.com/Fyrestar/cookie-consent

	const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

	function decode( string ) {

		return isSafari ? decodeURIComponent( string ) : string;

	}

	function encode( string ) {

		return isSafari ? encodeURIComponent( string ) : string;

	}

	function flushCookies() {

		const cookies = document.cookie.split( ";" );

		for ( let i = 0; i < cookies.length; i++ ) {
			const cookie = cookies[ i ];
			const eqPos = cookie.indexOf( "=" );
			const name = eqPos > -1 ? cookie.substr( 0, eqPos ) : cookie;
			document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
		}

	}

	function getCookie( cname ) {
		let name = cname + "=";
		let ca = document.cookie.split( ';' );
		for ( let i = 0; i < ca.length; i++ ) {
			let c = ca[ i ];
			while ( c.charAt( 0 ) === ' ' ) {
				c = c.substring( 1 );
			}
			if ( c.indexOf( name ) === 0 ) {
				return decode( c.substring( name.length, c.length ) );
			}
		}
		return "";
	}

	function setCookie( cname, cvalue, exdays ) {
		let d = new Date();
		d.setTime( d.getTime() + ( exdays * 24 * 60 * 60 * 1000 ) );
		let expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + encode(cvalue) + ";" + expires + ";path=/";
	}


	let settings, hasChanged = false;

	const cookies = {};

	function getSettings() {

		const str = getCookie( options.cookieName );

		if ( str ) {

			return JSON.parse( str );

		}

		return null;
	}

	function setSettings( object ) {

		setCookie( options.cookieName, JSON.stringify( object ), options.expiresInDays || 365 );

	}


	function optout( cookieName ) {

		settings = settings || getSettings();

		if ( settings ) {

			// Settings must exist at this point

			let cookie;

			for ( let name in settings.groups ) {

				const group = settings.groups[ name ];

				if ( group.accepted === false ) {

					const message = t( 'optoutAlready' );

					if ( message )
						alert( message );

					return;
				}

				if ( group.cookies[ cookieName ] ) {

					cookie = group.cookies[ cookieName ];
					break;

				}

			}


			if ( cookie ) {

				if ( cookie.accepted === false ) {

					const message = t( 'optoutAlready' );

					if ( message )
						alert( message );

				} else {

					cookie.accepted = false;


					const message = t( 'optout_' + cookie.name ) || t( 'optoutSuccess' );

					if ( message )
						alert( message );

					if ( options.onOptout instanceof Function )
						options.onOptout( cookie.id, settings );

					setSettings( settings );

					if ( options.optoutReload )
						location.reload();

				}


			} else {

				const message = t( 'optoutError' );

				if ( message )
					alert( message );

			}

		}

	}

	function groupCookies( group, accepted ) {

		let cookies = {};

		for ( let i = 0, l = group.cookies.length; i < l; i++ ) {

			const cookie = group.cookies[ i ];

			cookies[ cookie.name ] = {
				id: cookie.id || cookie.provider,
				accepted: cookie.accepted === undefined ? accepted : cookie.accepted
			};
		}

		return cookies;
	}

	function mount( settings, checkForUpdates ) {

		// Returns false if consent is required

		let needsConsent = false;


		for ( let i = 0, l = options.groups.length; i < l; i++ ) {

			const group = options.groups[ i ];

			const groupState = settings.groups[ group.name ];

			group.accepted = groupState.accepted;

			if ( !options.ignoreNewGroups ) {

				if ( groupState === undefined ) {

					// New group

					group.isNew = true;
					group.accepted = groupState.accepted;
					needsConsent = true;

				} else if ( !options.ignoreNewCookies ) {

					for ( let name in group.cookies ) {

						const cookie = group.cookies[ name ];
						const oldCookie = groupState.cookies[ cookie.name ];

						if ( oldCookie === undefined ) {

							// New cookie

							group.isNew = true;
							cookie.isNew = true;
							needsConsent = true;

						} else {

							// Keep state

							cookie.accepted = oldCookie.accepted;

						}

					}

				}


			}

			// Apply last settings

			if ( groupState )
				group.default = groupState.accepted;


		}


		// Mount plugins if consent given

		if ( !checkForUpdates || !needsConsent ) {

			for ( let i = 0; i < options.groups.length; i++ ) {

				const group = options.groups[ i ];

				for ( let i = 0, l = group.cookies.length; i < l; i++ ) {

					const cookie = group.cookies[ i ];

					const allowed = ( group.accepted && cookie.accepted !== false );

					if ( allowed && cookie.mount instanceof Function ) {

						cookie.mount();

					} else if ( cookie.denied instanceof Function ) {

						cookie.denied();

					}

				}


			}

			for ( let name in settings.groups ) {

				const group = settings.groups[ name ];

				for ( let name in group.cookies ) {

					const cookie = group.cookies[ name ];
					const allowed = ( group.accepted && cookie.accepted !== false );


					if ( cookies[ cookie.id ] !== undefined ) {

						const callbacks = cookies[ cookie.id ];

						for ( let i = 0, l = callbacks.length; i < l; i++ )
							callbacks[ i ]( allowed );

					} else {

						cookies[ cookie.id ] = allowed || false;

					}


				}


			}


			// Check for opt-out elements

			if ( !options.optoutURI || location.pathname.substring( 1 ) === options.optoutURI ) {

				const hookLinks = function () {

					if ( document.readyState === 'complete' ) {

						if ( options.consentReset ) {

							const element = document.getElementById( 'reset-consent' );


							touch( element, function () {

								flushCookies();


								const message = t( 'consentReset' );

								if ( message )
									alert( message );

								location.reload();

							} );
						}


						for ( let i = 0, l = options.groups.length; i < l; i++ ) {

							const group = options.groups[ i ];

							const groupState = settings.groups[ group.name ];


							for ( let i = 0, l = group.cookies.length; i < l; i++ ) {

								const cookie = group.cookies[ i ];

								if ( cookie.optoutElement ) {


									const element = document.getElementById( cookie.optoutElement );

									if ( element ) {

										element.setAttribute( 'data-cookie', cookie.name );

										touch( element, function () {

											optout( element.getAttribute( 'data-cookie' ) );

										} );

									}

								}

							}


						}

					}

				};

				if ( document.readyState === 'complete' )
					hookLinks();
				else
					document.addEventListener( 'readystatechange', hookLinks );
			}

		}

		// Event: consent is given and allowed plugins mounted

		if ( !needsConsent && options.onMounted instanceof Function )
			options.onMounted( settings );


		return !needsConsent;

	}


	options.cookieName = options.cookieName || 'cookieSettings';

	settings = getSettings();

	const module = {

		settings,

		flushCookies,
		getCookie,
		setCookie,

		feedback: function ( id, callback ) {

			if ( cookies[ id ] === true || cookies[ id ] === false )
				return callback( cookies[ id ] );

			if ( cookies[ id ] === undefined )
				cookies[ id ] = [];

			cookies[ id ].push( callback );

		}

	};

	if ( settings ) {

		if ( mount( settings, true ) )
			return module;

		hasChanged = true;

	}


	options.buttons = options.buttons || [ 'allowCookies', 'allowSelection' ];


	function wrap( html ) {

		const wrapper = document.createElement( 'div' );
		wrapper.innerHTML = html;

		return wrapper.children[ 0 ];
	}

	function t( token, number ) {

		const text = options.text[ token ];


		if ( number && text instanceof Array ) {

			return text[ number > 1 ? 1 : 0 ];

		} else {

			return text;

		}

	}

	function touch( element, cb ) {

		element.addEventListener( 'click', function ( e ) {

			e.preventDefault();

			cb.call( this, e );

			return false;

		} );
		element.addEventListener( 'touchend', cb );

	}

	function execute() {

		let style = options.style || `

		.cc-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			position: absolute;
			left: 0;right:
			0;bottom: 0;
			background-color: #edededb0;
			z-index: 10000;
			padding: 1em;
			border-top: 3px solid #292929;
			backdrop-filter: blur(3px);
			max-height: 100vh;
			overflow-y: scroll;
		}
		.cc-container > :first-child {
			display: flex;
			max-width: 100%;
			width: 80vh;
		}
		.cc-new {
			box-shadow: inset 0 0 0 3px orange;
		}
		.cc-tab {
			-webkit-user-select: none;
			-ms-user-select: none;
			user-select: none;
			cursor: pointer;
			display: flex;
			align-items: center;
			background-color: #d7d7d7;
			margin: 4px;
			padding: 0 4px;
		}
		.cc-tab[active="true"] {
			background-color: white;
		}
		.cc-tab > * {
			margin: 4px;
			white-space: nowrap;
		}

		.cc-table {
			margin-top: 10px;
			table-layout: fixed;
			width: 100%;
		    font-size: 80%;
		}
		.cc-table thead {
			font-weight: bold;
		}
		.cc-table > tbody > tr > td {
			border-top: 1px solid gray;
		}
		.cc-table td:not(:last-child) {
			border-right: 1px solid gray;
		}
		.cc-table td {
			padding: 4px;
			word-wrap: break-word;
		}
		.cc-actions {
			display: flex;
			flex-wrap: wrap;
		}
		.cc-details {
			display:flex;
			height: 25vh;
			width: 50vw;
			flex-direction: column;
			width: 80vh;
			max-width: 90vw;
			overflow: auto;
		}
		.cc-details > div {
			margin: 5px;
			display: flex;
		}
		.cc-action {
			-webkit-user-select: none;
			-ms-user-select: none;
			user-select: none;
			white-space: nowrap;
			border: 2px solid gray;
			background-color: gray;
			color: white;
			font-weight: bold;
			padding: .5em 1em;
			margin: 10px;
			flex-grow: 1;
			align-self: center;
			cursor: pointer;
		}
		.cc-action-settings {
			-webkit-user-select: none;
			-ms-user-select: none;
			user-select: none;
			display: table;
			cursor: pointer;
			padding: 4px 6px;
			margin-top: 10px;
			border: 1px solid;
			width: fit-content;
			font-size: 90%;
		}
		.cc-action-settings[active="true"] {
			background-color: white;
		}
		.cc-primary {
			background-color: green;
		}
		.cc-message {
			padding: 0 20px;
			font-size: 90%;
		}
		.cc-changed {
			padding: 4px;
			color: white;
			background-color: orange;
			text-align: center;
		}
		@media only screen and (max-width: 600px) {
			.cc-container > div {
				flex-wrap: wrap;
			}
			.cc-table {
				table-layout: auto;
				width: 100%;
			}
		}
	`;

		if ( options.extraStyle )
			style += options.extraStyle;

		let overlayStyle = 'position: fixed; left: 0; right: 0; bottom: 0; z-index:9999;';

		if ( options.overlayStyle )
			overlayStyle += options.overlayStyle;

		const $style = wrap( `<style>${style}</style>` );

		document.head.appendChild( $style );

		const $overlay = wrap( `<div style="${overlayStyle}"><div class="cc-container"><div><p class="cc-message">${ t( 'message' ) }</p><div class="cc-actions"></div></div></div></div>` );
		const $container = $overlay.childNodes[ 0 ];
		const $message = $container.firstChild.childNodes[ 0 ];
		const $actions = $container.firstChild.childNodes[ 1 ];

		if ( hasChanged && options.text.changes )
			$message.innerHTML += t( 'changes' );


		// Apply and save settings

		function apply( allowAll ) {

			const settings = {
				accepted: true,
				groups: {}
			};

			for ( let i = 0, l = options.groups.length; i < l; i++ ) {

				const group = options.groups[ i ];

				settings.groups[ group.name ] = {
					accepted: allowAll === false ? ( group.required || false ) : ( allowAll || group.check.checked ),
					cookies: groupCookies( group, true ) // Remember list of cookies stored
				};

			}


			setSettings( settings );

			// Delete dom elements

			$overlay.parentNode.removeChild( $overlay );
			$style.parentNode.removeChild( $style );


			// Finish, don't compare for changes

			mount( settings, false );

		}


		// Use desired buttons

		const Actions = {
			allowCookies: {
				label: 'allowCookies',
				primary: true,
				call: function () {

					apply( true );

				}
			},
			allowSelection: {
				label: 'allowSelection',
				call: function () {

					apply();

				}
			},
			rejectCookies: {
				label: 'rejectCookies',
				call: function () {


					apply( false );

				}
			}
		};

		const actions = [];

		for ( let i = 0, l = options.buttons.length; i < l; i++ ) {

			const button = options.buttons[ i ];

			if ( Actions[ button ] )
				actions.push( Actions[ button ] );

		}


		// Render actions

		for ( let i = 0, l = actions.length; i < l; i++ ) {

			const action = actions[ i ];

			const $action = wrap( '<button class="cc-action"></button>' );
			$action.textContent = t( action.label );

			if ( action.className )
				$action.className += ' ' + action.className;

			if ( action.primary )
				$action.className += ' cc-primary';

			touch( $action, action.call );

			$actions.appendChild( $action );

		}


		// Render cookie groups

		const $details = wrap( `<div class="cc-action-settings">${t( 'details' )}</div>` );
		$message.appendChild( $details );

		if ( hasChanged )
			$details.className += ' cc-new';


		const $settings = wrap( `<div></div>` );
		$settings.style.display = 'none';
		$container.appendChild( $settings );

		const $table = wrap( `<div class="cc-details"><div></div><div></div></div>` );
		const $header = $table.children[ 0 ];
		const $body = $table.children[ 1 ];

		$settings.appendChild( $table );

		touch( $details, function ( e ) {

			const active = $settings.style.display === 'none';

			$settings.style.display = active ? 'block' : 'none';
			$details.setAttribute( 'active', active ? 'true' : 'false' );

		} );


		function showGroup( name ) {


			for ( let i = 0, l = options.groups.length; i < l; i++ ) {

				const group = options.groups[ i ];

				if ( group.name === name ) {

					group.body.style.display = 'block';
					group.header.setAttribute( 'active', 'true' );

					const newest = group.body.querySelector( '.cc-new' );

					if ( newest )
						newest.scrollIntoView();

				} else {

					group.body.style.display = 'none';
					group.header.setAttribute( 'active', 'false' );


				}

			}


		}

		for ( let i = 0, l = options.groups.length; i < l; i++ ) {

			const group = options.groups[ i ];

			const $gh = wrap( `<div class="cc-tab"><input type="checkbox" /><div tab="${group.name}">${group.label} (${group.cookies.length})</div></div>` );
			const $gc = $gh.firstChild;
			const $gl = $gh.lastChild;
			$header.appendChild( $gh );

			if ( group.isNew )
				$gh.className += ' cc-new';

			if ( group.default !== undefined )
				$gc.checked = group.default;

			if ( settings && settings.groups[ group.name ] && settings.groups[ group.name ].accepted )
				$gc.checked = true;


			if ( group.required )
				$gc.disabled = true;


			let html = `<div>${group.purpose}<table class="cc-table"><thead><tr><td>${t( "name" )}</td><td>${t( "provider" )}</td><td>${t( "purpose" )}</td><td>${t( "expiration" )}</td><td>${t( "type" )}</td></tr></thead><tbody>`;

			for ( let i = 0, l = group.cookies.length; i < l; i++ ) {

				const cookie = group.cookies[ i ];

				let expires = '';

				if ( cookie.expires.indexOf( ' ' ) > -1 ) {

					const tokens = cookie.expires.split( ' ' );

					expires = tokens[ 0 ] + ' ' + t( tokens[ 1 ], tokens[ 0 ] );

				}

				html += `<tr${ cookie.isNew ? ' class="cc-new"' : ''}><td>${cookie.name}</td><td>${cookie.provider}</td><td>${cookie.purpose || group.label}</td><td>${expires}</td><td>${cookie.type || 'HTTP'}</td></tr>`;

			}

			html += '</tbody></table></div>';


			const $gb = wrap( html );
			$body.appendChild( $gb );

			group.header = $gh;
			group.body = $gb;
			group.check = $gc;


			touch( $gl, function ( e ) {

				showGroup( e.target.getAttribute( 'tab' ) );

			} );

		}

		showGroup( options.groups[ 0 ].name );

		document.body.appendChild( $overlay );


	}


	if ( !document.body ) {

		document.addEventListener( 'readystatechange', function ( e ) {

			if ( document.readyState === 'complete' )
				execute();

		} );

	} else {

		execute();

	}

	return module;

}