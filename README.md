## HtmlQ

by [aproxima Gesellschaft für Markt- und Sozialforschung Weimar](http://www.aproxima.de/).

Q-sorting tool in HTML5. Backwards compatible with settings files of [FlashQ](http://www.hackert.biz/flashq/home/).

## FAQ

You can find the FAQ here: [https://github.com/aproxima/htmlq/wiki/FAQ](https://github.com/aproxima/htmlq/wiki/FAQ)

## Features

* Responsive layout for iPad and Android tablets
* Compatible with Internet Explorer 8 and later
* Compatible with settings files of [FlashQ](http://www.hackert.biz/flashq/home/)
* Compatible with [FlashQ PHP backend](http://www.hackert.biz/flashq/downloads/)
* Unique participant identifier can be passed via query paramater

## Getting started

1. Download the latest release at [https://github.com/aproxima/htmlq/releases](https://github.com/aproxima/htmlq/releases)
2. Extract the archive
3. Edit .xml files in the `settings` folder: Specify your statements, configure the map, change the translation, add a password...
4. While editing, you can try out the questionnaire at any time by opening `index.html` with Firefox

Once you're ready to start the survey:

5. Host the whole `htmlq` folder online using a web server such as Apache or nginx, or your web hosting company
6. Point your participants to the URL under which you made it available
7. If you want, you can add the [FlashQ PHP backend](http://www.hackert.biz/flashq/downloads/) to enable advanced functionality such as email export or CSV export

## Settings

All .XML files in the settings subfolder are compatible with the settings files of FlashQ. A description of the settings files can be found at [http://www.hackert.biz/flashq/faq/]().

### Additional settings (vs. FlashQ)

HtmlQ introduces a few new settings that were not available in FlashQ:

`settings/config.xml`:

```xml
    <!-- Disable the back button within the page. Users can always use the browser back button to navigate the survey anyway. -->
    <item id="disableBackButton">true</item>

    <!-- Make the font of the cards smaller so that users can read more of the text -->
    <item id="smallFont">false</item>
```


`settings/language.xml`:

```xml
    <!-- Label of the back button -->
    <item id="backButton">Back</item>

    <!-- Message that is shown to the user when not all required fields in step 5 were filled in -->
    <item id="fillInRequiredFields">Please fill in all required fields.</item>

    <!-- Warning that will be displayed to the user if they try to navigate away from the questionnaire and could lose their data -->
    <item id="leaveSiteWarning">Your answers will be lost.</item>
```

## Creating unique participation links (UID)

If you want to send out unique links to a HtmlQ survey that will automatically fill in the UID/user code, you can create links in the following format: [https://www.yourdomain.com/htmlq/#/?userCode=USERCODE](). In the resulting CSV file, the user code will show up in the UID field. This allows you to identify participants without requiring them to log in.

## Custom Logos

You can add up to three images (e.g. company logos) to the header by replacing the respective `logo.jpg`, `logo_center.jpg` and `logo_right.jpg` files.

## Caveats

Trying out the survey offline by opening `index.html` will only work with some browsers, Firefox being the most popular. Google Chrome's security settings disallow executing the survey from your local hard drive. Google Chrome will work fine however when the site is hosted using a web server or web hosting company.

## License

HtmlQ is released under the [MIT License](http://www.opensource.org/licenses/MIT).
