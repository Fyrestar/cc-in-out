"use strict";

function CookieConsent(options) {

	function flushCookies() {

		var cookies = document.cookie.split(";");

		for (var i = 0; i < cookies.length; i++) {
			var cookie = cookies[i];
			var eqPos = cookie.indexOf("=");
			var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
			document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
		}
	}

	function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for (var i = 0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) === ' ') {
				c = c.substring(1);
			}
			if (c.indexOf(name) === 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

	function setCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
		var expires = "expires=" + d.toUTCString();
		document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
	}

	var settings = void 0,
	    hasChanged = false;

	var cookies = {};

	function getSettings() {

		var str = getCookie(options.cookieName);

		if (str) {

			return JSON.parse(str);
		}

		return null;
	}

	function setSettings(object) {

		setCookie(options.cookieName, JSON.stringify(object), options.expiresInDays || 365);
	}

	function optout(cookieName) {

		settings = settings || getSettings();

		if (settings) {

			// Settings must exist at this point

			var cookie = void 0;

			for (var name in settings.groups) {

				var group = settings.groups[name];

				if (group.accepted === false) {

					var message = t('optoutAlready');

					if (message) alert(message);

					return;
				}

				if (group.cookies[cookieName]) {

					cookie = group.cookies[cookieName];
					break;
				}
			}

			if (cookie) {

				if (cookie.accepted === false) {

					var _message = t('optoutAlready');

					if (_message) alert(_message);
				} else {

					cookie.accepted = false;

					var _message2 = t('optout_' + cookie.name) || t('optoutSuccess');

					if (_message2) alert(_message2);

					if (options.onOptout instanceof Function) options.onOptout(cookie.id, settings);

					setSettings(settings);

					if (options.optoutReload) location.reload();
				}
			} else {

				var _message3 = t('optoutError');

				if (_message3) alert(_message3);
			}
		}
	}

	function groupCookies(group, accepted) {

		var cookies = {};

		for (var i = 0, l = group.cookies.length; i < l; i++) {

			var cookie = group.cookies[i];

			cookies[cookie.name] = {
				id: cookie.id || cookie.provider,
				accepted: cookie.accepted === undefined ? accepted : cookie.accepted
			};
		}

		return cookies;
	}

	function mount(settings, checkForUpdates) {

		// Returns false if consent is required

		var needsConsent = false;

		for (var i = 0, l = options.groups.length; i < l; i++) {

			var group = options.groups[i];

			var groupState = settings.groups[group.name];

			group.accepted = groupState.accepted;

			if (!options.ignoreNewGroups) {

				if (groupState === undefined) {

					// New group

					group.isNew = true;
					group.accepted = groupState.accepted;
					needsConsent = true;
				} else if (!options.ignoreNewCookies) {

					for (var name in group.cookies) {

						var cookie = group.cookies[name];
						var oldCookie = groupState.cookies[cookie.name];

						if (oldCookie === undefined) {

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

			if (groupState) group.default = groupState.accepted;
		}

		// Mount plugins if consent given

		if (!checkForUpdates || !needsConsent) {

			for (var _i = 0; _i < options.groups.length; _i++) {

				var _group = options.groups[_i];

				for (var _i2 = 0, _l = _group.cookies.length; _i2 < _l; _i2++) {

					var _cookie = _group.cookies[_i2];

					var allowed = _group.accepted && _cookie.accepted !== false;

					if (allowed && _cookie.mount instanceof Function) {

						_cookie.mount();
					} else if (_cookie.denied instanceof Function) {

						_cookie.denied();
					}
				}
			}

			for (var _name in settings.groups) {

				var _group2 = settings.groups[_name];

				for (var _name2 in _group2.cookies) {

					var _cookie2 = _group2.cookies[_name2];
					var _allowed = _group2.accepted && _cookie2.accepted !== false;

					if (cookies[_cookie2.id] !== undefined) {

						var callbacks = cookies[_cookie2.id];

						for (var _i3 = 0, _l2 = callbacks.length; _i3 < _l2; _i3++) {
							callbacks[_i3](_allowed);
						}
					} else {

						cookies[_cookie2.id] = _allowed || false;
					}
				}
			}

			// Check for opt-out elements

			if (!options.optoutURI || location.pathname.substring(1) === options.optoutURI) {

				var hookLinks = function hookLinks() {

					if (document.readyState === 'complete') {

						if (options.consentReset) {

							var element = document.getElementById('reset-consent');

							touch(element, function () {

								flushCookies();

								var message = t('consentReset');

								if (message) alert(message);

								location.reload();
							});
						}

						for (var _i4 = 0, _l3 = options.groups.length; _i4 < _l3; _i4++) {

							var _group3 = options.groups[_i4];

							var _groupState = settings.groups[_group3.name];

							for (var _i5 = 0, _l4 = _group3.cookies.length; _i5 < _l4; _i5++) {

								var _cookie3 = _group3.cookies[_i5];

								if (_cookie3.optoutElement) {
									(function () {

										var element = document.getElementById(_cookie3.optoutElement);

										if (element) {

											element.setAttribute('data-cookie', _cookie3.name);

											touch(element, function () {

												optout(element.getAttribute('data-cookie'));
											});
										}
									})();
								}
							}
						}
					}
				};

				if (document.readyState === 'complete') hookLinks();else document.addEventListener('readystatechange', hookLinks);
			}
		}

		// Event: consent is given and allowed plugins mounted

		if (!needsConsent && options.onMounted instanceof Function) options.onMounted(settings);

		return !needsConsent;
	}

	options.cookieName = options.cookieName || 'cookieSettings';

	settings = getSettings();

	var module = {

		settings: settings,

		getCookie: getCookie,
		setCookie: setCookie,

		feedback: function feedback(id, callback) {

			if (cookies[id] === true || cookies[id] === false) return callback(cookies[id]);

			if (cookies[id] === undefined) cookies[id] = [];

			cookies[id].push(callback);
		}

	};

	if (settings) {

		if (mount(settings, true)) return module;

		hasChanged = true;
	}

	options.buttons = options.buttons || ['allowCookies', 'allowSelection'];

	function wrap(html) {

		var wrapper = document.createElement('div');
		wrapper.innerHTML = html;

		return wrapper.children[0];
	}

	function t(token, number) {

		var text = options.text[token];

		if (number && text instanceof Array) {

			return text[number > 1 ? 1 : 0];
		} else {

			return text;
		}
	}

	function touch(element, cb) {

		element.addEventListener('click', function (e) {

			e.preventDefault();

			cb.call(this, e);

			return false;
		});
		element.addEventListener('touchend', cb);
	}

	var style = options.style || "\n\n\t\t.cc-container {\n\t\t\tdisplay: flex;\n\t\t\tflex-direction: column;\n\t\t\talign-items: center;\n\t\t\tposition: absolute;\n\t\t\tleft: 0;right:\n\t\t\t0;bottom: 0;\n\t\t\tbackground-color: #edededb0;\n\t\t\tz-index: 10000;\n\t\t\tpadding: 1em;\n\t\t\tborder-top: 3px solid #292929;\n\t\t\tbackdrop-filter: blur(3px);\n\t\t\tmax-height: 100vh;\n\t\t\toverflow-y: scroll;\n\t\t}\n\t\t.cc-container > :first-child {\n\t\t\tdisplay: flex;\n\t\t\tmax-width: 100%;\n\t\t\twidth: 80vh;\n\t\t}\n\t\t.cc-new {\n\t\t\tbox-shadow: inset 0 0 0 3px orange;\n\t\t}\n\t\t.cc-tab {\n\t\t\t-webkit-user-select: none;\n\t\t\t-ms-user-select: none;\n\t\t\tuser-select: none;\n\t\t\tcursor: pointer;\n\t\t\tdisplay: flex;\n\t\t\talign-items: center;\n\t\t\tbackground-color: #d7d7d7;\n\t\t\tmargin: 4px;\n\t\t\tpadding: 0 4px;\n\t\t}\n\t\t.cc-tab[active=\"true\"] {\n\t\t\tbackground-color: white;\n\t\t}\n\t\t.cc-tab > * {\n\t\t\tmargin: 4px;\n\t\t\twhite-space: nowrap;\n\t\t}\n\n\t\t.cc-table {\n\t\t\tmargin-top: 10px;\n\t\t\ttable-layout: fixed;\n\t\t\twidth: 100%;\n\t\t    font-size: 80%;\n\t\t}\n\t\t.cc-table thead {\n\t\t\tfont-weight: bold;\n\t\t}\n\t\t.cc-table > tbody > tr > td {\n\t\t\tborder-top: 1px solid gray;\n\t\t}\n\t\t.cc-table td:not(:last-child) {\n\t\t\tborder-right: 1px solid gray;\n\t\t}\n\t\t.cc-table td {\n\t\t\tpadding: 4px;\n\t\t\tword-wrap: break-word;\n\t\t}\n\t\t.cc-actions {\n\t\t\tdisplay: flex;\n\t\t\tflex-wrap: wrap;\n\t\t}\n\t\t.cc-details {\n\t\t\tdisplay:flex;\n\t\t\theight: 25vh;\n\t\t\twidth: 50vw;\n\t\t\tflex-direction: column;\n\t\t\twidth: 80vh;\n\t\t\tmax-width: 90vw;\n\t\t\toverflow: auto;\n\t\t}\n\t\t.cc-details > div {\n\t\t\tmargin: 5px;\n\t\t\tdisplay: flex;\n\t\t}\n\t\t.cc-action {\n\t\t\t-webkit-user-select: none;\n\t\t\t-ms-user-select: none;\n\t\t\tuser-select: none;\n\t\t\twhite-space: nowrap;\n\t\t\tborder: 2px solid gray;\n\t\t\tbackground-color: gray;\n\t\t\tcolor: white;\n\t\t\tfont-weight: bold;\n\t\t\tpadding: .5em 1em;\n\t\t\tmargin: 10px;\n\t\t\tflex-grow: 1;\n\t\t\talign-self: center;\n\t\t\tcursor: pointer;\n\t\t}\n\t\t.cc-action-settings {\n\t\t\t-webkit-user-select: none;\n\t\t\t-ms-user-select: none;\n\t\t\tuser-select: none;\n\t\t\tdisplay: table;\n\t\t\tcursor: pointer;\n\t\t\tpadding: 4px 6px;\n\t\t\tmargin-top: 10px;\n\t\t\tborder: 1px solid;\n\t\t\twidth: fit-content;\n\t\t\tfont-size: 90%;\n\t\t}\n\t\t.cc-action-settings[active=\"true\"] {\n\t\t\tbackground-color: white;\n\t\t}\n\t\t.cc-primary {\n\t\t\tbackground-color: green;\n\t\t}\n\t\t.cc-message {\n\t\t\tpadding: 0 20px;\n\t\t\tfont-size: 90%;\n\t\t}\n\t\t.cc-changed {\n\t\t\tpadding: 4px;\n\t\t\tcolor: white;\n\t\t\tbackground-color: orange;\n\t\t\ttext-align: center;\n\t\t}\n\t\t@media only screen and (max-width: 600px) {\n\t\t\t.cc-container > div {\n\t\t\t\tflex-wrap: wrap;\n\t\t\t}\n\t\t\t.cc-table {\n\t\t\t\ttable-layout: auto;\n\t\t\t\twidth: 100%;\n\t\t\t}\n\t\t}\n\t";

	if (options.extraStyle) style += options.extraStyle;

	var overlayStyle = 'position: fixed; left: 0; right: 0; bottom: 0; z-index:9999;';

	if (options.overlayStyle) overlayStyle += options.overlayStyle;

	var $style = wrap("<style>" + style + "</style>");

	document.head.appendChild($style);

	var $overlay = wrap("<div style=\"" + overlayStyle + "\"><div class=\"cc-container\"><div><p class=\"cc-message\">" + t('message') + "</p><div class=\"cc-actions\"></div></div></div></div>");
	var $container = $overlay.childNodes[0];
	var $message = $container.firstChild.childNodes[0];
	var $actions = $container.firstChild.childNodes[1];

	if (hasChanged && options.text.changes) $message.innerHTML += t('changes');

	// Apply and save settings

	function apply(allowAll) {

		var settings = {
			accepted: true,
			groups: {}
		};

		for (var i = 0, l = options.groups.length; i < l; i++) {

			var group = options.groups[i];

			settings.groups[group.name] = {
				accepted: allowAll === false ? group.required || false : allowAll || group.check.checked,
				cookies: groupCookies(group, true) // Remember list of cookies stored
			};
		}

		setSettings(settings);

		// Delete dom elements

		$overlay.parentNode.removeChild($overlay);
		$style.parentNode.removeChild($style);

		// Finish, don't compare for changes

		mount(settings, false);
	}

	// Use desired buttons

	var Actions = {
		allowCookies: {
			label: 'allowCookies',
			primary: true,
			call: function call() {

				apply(true);
			}
		},
		allowSelection: {
			label: 'allowSelection',
			call: function call() {

				apply();
			}
		},
		rejectCookies: {
			label: 'rejectCookies',
			call: function call() {

				apply(false);
			}
		}
	};

	var actions = [];

	for (var i = 0, l = options.buttons.length; i < l; i++) {

		var button = options.buttons[i];

		if (Actions[button]) actions.push(Actions[button]);
	}

	// Render actions

	for (var _i6 = 0, _l5 = actions.length; _i6 < _l5; _i6++) {

		var action = actions[_i6];

		var $action = wrap('<button class="cc-action"></button>');
		$action.textContent = t(action.label);

		if (action.className) $action.className += ' ' + action.className;

		if (action.primary) $action.className += ' cc-primary';

		touch($action, action.call);

		$actions.appendChild($action);
	}

	// Render cookie groups

	var $details = wrap("<div class=\"cc-action-settings\">" + t('details') + "</div>");
	$message.appendChild($details);

	if (hasChanged) $details.className += ' cc-new';

	var $settings = wrap("<div></div>");
	$settings.style.display = 'none';
	$container.appendChild($settings);

	var $table = wrap("<div class=\"cc-details\"><div></div><div></div></div>");
	var $header = $table.children[0];
	var $body = $table.children[1];

	$settings.appendChild($table);

	touch($details, function (e) {

		var active = $settings.style.display === 'none';

		$settings.style.display = active ? 'block' : 'none';
		$details.setAttribute('active', active ? 'true' : 'false');
	});

	function showGroup(name) {

		for (var _i7 = 0, _l6 = options.groups.length; _i7 < _l6; _i7++) {

			var group = options.groups[_i7];

			if (group.name === name) {

				group.body.style.display = 'block';
				group.header.setAttribute('active', 'true');

				var newest = group.body.querySelector('.cc-new');

				if (newest) newest.scrollIntoView();
			} else {

				group.body.style.display = 'none';
				group.header.setAttribute('active', 'false');
			}
		}
	}

	for (var _i8 = 0, _l7 = options.groups.length; _i8 < _l7; _i8++) {

		var group = options.groups[_i8];

		var $gh = wrap("<div class=\"cc-tab\"><input type=\"checkbox\" /><div tab=\"" + group.name + "\">" + group.label + " (" + group.cookies.length + ")</div></div>");
		var $gc = $gh.firstChild;
		var $gl = $gh.lastChild;
		$header.appendChild($gh);

		if (group.isNew) $gh.className += ' cc-new';

		if (group.default !== undefined) $gc.checked = group.default;

		if (settings && settings.groups[group.name] && settings.groups[group.name].accepted) $gc.checked = true;

		if (group.required) $gc.disabled = true;

		var html = "<div>" + group.purpose + "<table class=\"cc-table\"><thead><tr><td>" + t("name") + "</td><td>" + t("provider") + "</td><td>" + t("purpose") + "</td><td>" + t("expiration") + "</td><td>" + t("type") + "</td></tr></thead><tbody>";

		for (var _i9 = 0, _l8 = group.cookies.length; _i9 < _l8; _i9++) {

			var cookie = group.cookies[_i9];

			var expires = '';

			if (cookie.expires.indexOf(' ') > -1) {

				var tokens = cookie.expires.split(' ');

				expires = tokens[0] + ' ' + t(tokens[1], tokens[0]);
			}

			html += "<tr" + (cookie.isNew ? ' class="cc-new"' : '') + "><td>" + cookie.name + "</td><td>" + cookie.provider + "</td><td>" + (cookie.purpose || group.label) + "</td><td>" + expires + "</td><td>" + (cookie.type || 'HTTP') + "</td></tr>";
		}

		html += '</tbody></table></div>';

		var $gb = wrap(html);
		$body.appendChild($gb);

		group.header = $gh;
		group.body = $gb;
		group.check = $gc;

		touch($gl, function (e) {

			showGroup(e.target.getAttribute('tab'));
		});
	}

	showGroup(options.groups[0].name);

	document.body.appendChild($overlay);

	return module;
}
