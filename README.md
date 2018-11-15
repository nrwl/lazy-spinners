# Spinner

## How to build

* Run `yarn` (or `npm install`)
* Run `yarn build ` (or `npm run build`)

The project will create the `package` folder. Copy the contents of the folder into your `node_modules`. You can also tar the folder to make it installable with `npm install` or `yarn`.

## How to serve the example app

You'll need to build the package before you can serve the example app. Once you built it, do the following:

* `cd example`
* `yarn` (or `npm install`) (this will copy the package over)
* `./copy.ps1`
* `ng serve`
* open `localhost:4200`

The example app has two spinners: the global one and and the inner one (loaded lazily). To see them in action, do the following:

* Click on `Open CompB` => global spinner will trigger.
* Click on `Open LazyCompA' => global spinner will trigger (because we haven't loaded the inner spinner yet).
* Click on `Open LazyCompB' => the inner spinner will trigger. 
* Click on `Open LazyCompA' => the inner spinner will trigger. 
* Click on `Open CompB' => the global spinner will trigger. 


## Notes

* Currently, the spinner directly just applies the "spinning" class to the element, but it can be changed to do whatever we will need it to do.
* forChild and forRoot take `PrefixMatcherConfig[]`. If you want to provide different matchers, pass the following provider:

```
{provide: Matcher, multi: true, useFactory: myCustomMatcher}
```