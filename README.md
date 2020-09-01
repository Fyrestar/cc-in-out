# cookie-consent (cc-in-out)
A plain js lightweight cookie banner with opt-in and opt-out API. Groups of cookies can be defined and be selected by the user and only approved groups
will fire their specific code such as for Google or Facebook tracking.

A Group can be set as required (checkbox disabled) and selected by default. Buttons to either allow cookies (all) or only use the selection
are shown, another button to reject all non-required can be used as well.

### [Demo](https://mevedia.com/share/cookieconsent/)

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

*Disclaimer: i'm not providing legal advice, please consult a lawyer for legal information*

As of current state a opt-in dialog conforms DSGVO for marketing tracking *including Google Analytics*, most of all users wouldn't take
effort to opt-in to be tracked, it is unlikely that explicitly enabling a checkbox would be ever required as this
would make tracking useless. So the best way seems to be pre-selecting the cookie groups you really need.

In most of all cases users are annoyed by any type of cookie banner and won't read or care for any options, so
an "Allow" and "Limit" button should give the best results. The DSGVO states the user must have an option to decide,
not that it has to be more easy to disabled tracking.
