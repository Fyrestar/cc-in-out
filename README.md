# cookie-consent (cc-in-out)
A plain js lightweight cookie banner with opt-in and opt-out API. Groups of cookies can be defined and be selected by the user and only approved groups
will fire their specific code such as for Google or Facebook tracking.

A Group can be set as required (checkbox disabled) and selected by default. Buttons to either allow cookies (all) or only use the selection
are shown, another button to reject all non-required can be used as well.

### [Demo](https://mevedia.com/share/cookieconsent/)

### Dialog
![cc-in-out](/ccinout.png)

### Settings
![cc-in-out](/ccinout-settings.png)

### After adding new services/cookies
![cc-in-out](/ccinout-changes.png)


## Build

Build ES5 bundle with babel and minify with closure compiler.

```
$ npm run build
```

## Features

- Multi-language
- Opt-in: groups of cookies with detailed description for each group and cookies.
- Opt-out: specify a element ID for a links that will opt-out a group. (links usually placed in the privacy policies)
- Allow reset consent to flush all cookies of the site (won't work for HttpOnly or with path set)
- Ask again on changes: option to ask for consent again when new cookies or groups are added, this can be reduced to groups only, i recommend ask again on any change for full transparency. New or changed groups and cookies are highlighted.
- Buttons for allow, limit and only necessary can be used.
- Custom CSS string or null to only use a external style file
- Multiple consent callbacks on cookies can be used across scripts
- Responsive without js hacking

Tested with major browsers and IE 11, improving support for older browsers but unsupported browsers aren't legally a requirement anymore.


## API

```javascript
var consent = CookieConsent({


	// When the settings cookie will expire and the dialog is shown again, default 365
	expiresInDays: 365,

	// Optional: Don't prompt again when new groups or cookies added, default false.
	ignoreNewGroups: false,

	// Optional: Prompt on new groups but not cookies, default false.
	ignoreNewCookies: false,

	// Optional: Reload page after optout, if optoutSuccess text is defined a alert message is shown before, default false.
	optoutReload: true,

	// Optional: Only look for optout links at given site uri, default none
	// optoutURI: 'data-policy',

	// Optional: Callback when a cookie got opted out
	//onOptout: function( cookieID ) {},

	// A element with the id "reset-consent" will attempt to delete all cookies for the page (won't work for HttpOnly or with path set)
	consentReset: true,

	// Optional: Callback when the consent has been reset
	// onConsentReset: function() {}

	// Optional: Kind of buttons to use, available is allowCookies, allowSelection and rejectCookies
	// buttons: [ 'allowCookies', 'rejectCookies' ],

	// Translations
	text: {
		day: [ 'Day', 'Days' ],
		year: [ 'Year', 'Years' ],
		allowCookies: 'Allow Cookies',
		allowSelection: 'Allow Selection',
		rejectCookies: 'Reject Cookies',
		details: 'Settings',
		name: 'Name',
		provider: 'Provider',
		expiration: 'Expiration',
		type: 'Type',
		purpose: 'Purpose',
		optoutAlready: 'You have already deactivated this function.',
		optoutSuccess: 'Successfully deactivated.',
		changes: '<p class="cc-changed">We got new cookies</p>',
		consentReset: 'You have objected your consent, notice not all cookies can be deleted now and will stay until they expire.',
		message: 'In order to make our site user friendly as possible and improve our services, we are using cookies. For more informations about cookies please see our <a href="/datenschutz/" target="_blank">privacy-policy</a>.'
	},

	// Cookie groups, can be required (disabled) and pre-selected setting default to true.

	groups: [
		{
			label: 'Essential',
			name: 'essential',
			required: true,
			default: true,
			purpose: 'Essential cookies help us making our site run by enabling functions as navigation to protected areas. Without our website cannot work properly.',
			cookies: [
				{
					name: 'cookieSettings',
					provider: 'Our Website',
					purpose: '',
					type: 'HTTP',
					expires: '1 year'
				},
				{
					name: 'PHPSESSID',
					expires: '395 day',
					provider: 'Our Website'
				}
			]
		},
		{
			label: 'Marketing',
			name: 'marketing',
			default: true,
			purpose: 'Marketing-Cookies are used to follow traffic on our website. The intention is to improve our services and only show you ads that are relevant to you with the help of third party services.',
			cookies: [
				{
					name: '_fbp',
					expires: '90 day',
					provider: 'Facebook',
					type: 'Pixel',
					id: 'fbConversions',
					optoutElement: 'optoutFacebook',
					mount: function() {

					}
				},
				{
					name: '_ga, _gid, _giad, _gat, _dc_gtm_xxx, _gat_gtag_xxx, _gac_xxx, IDE',
					expires: '395 day',
					provider: 'Google',
					id: 'GA',
					mount: function() {

					}
				}
			]
		}
	]
});


// You can wait for permission in later callbacks, feedback can be used multiple times for every cookie block definition

consent.feedback( 'fbConversions', function( allowed ) {

	var text = document.createElement('div');
	text.textContent = 'Facebook ' + ( allowed ? 'allowed' : 'denied' );
	document.body.appendChild( text );

});


consent.feedback( 'GA', function( allowed ) {

	var text = document.createElement('div');
	text.textContent = 'Google Analytics ' + ( allowed ? 'allowed' : 'denied' );
	document.body.appendChild( text );

	/* Your actual code might look like:

	if ( allowed ) {

		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

		var gaProp = 'PROPERTY-ID';

		ga('create', gaProp, 'auto');
		ga('set', 'anonymizeIp', true);
		ga('send', 'pageview');

	}
	*/

});

consent.feedback( 'GAC', function( allowed ) {

	var text = document.createElement('div');
	text.textContent = 'Google Conversions ' + ( allowed ? 'allowed' : 'denied' );
	document.body.appendChild( text );

});
```

## Notes about cookie consent

*Disclaimer: i'm not providing legal advice, please consult a lawyer for legal information*

As of current state a opt-in dialog conforms DSGVO for marketing tracking *including Google Analytics*, most of all users wouldn't take
effort to opt-in to be tracked, it is unlikely that explicitly enabling a checkbox would be ever required as this
would make tracking useless. So the best way seems to be pre-selecting the cookie groups you really need.

In most of all cases users are annoyed by any type of cookie banner and won't read or care for any options, so
an "Allow" and "Limit" button should give the best results. The DSGVO states the user must have an option to decide,
not that it has to be more easy to disabled tracking.
