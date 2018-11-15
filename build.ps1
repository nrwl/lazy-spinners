rm -r -Force package
mkdir -p package/@nrwl
ng-packagr -p package.json
mv dist package/@nrwl/spinner