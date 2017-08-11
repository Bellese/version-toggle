Version-Toggle
==============

Overview
--------

Version-Toggle (VT) is used for facilitating front-end development with version toggling of code. This form of version toggling is to ensure that end-users will not receive any form of code other than the version specified by the publishing developer. VT works by parsing through all of the files of a project and removing code based on specific comments in place in **html**, **css** and **js** files.

Installation
------------
```sh
npm install @bellese/version-toggle
```

Usage
-----

VT takes in 4 parameters:
1. conditions - an array of json objects of the format `{featureName: 'x.x.x'}` where featureName is the name of the feature toggled and 'x.x.x' is the semantic version you **want** to remain in the code. If you do not pass a feature in to this array, then that feature will not be version toggled. **REQUIRED**
2. exact - a boolean value marking that the user would like to exactly match against the versions passed in or not **optional - defaults to false**
3. inputDir - a string of the location to begin reading the files from **optional - defaults to src/**
4. outputDir - a string of the folder to place all of the newly stripped files **optional - defaults to ver/**

VT relies upon specific comments placed within the code to know what code to remove and what code to leave behind.
Examples of these comments and what the end result of having VT called on them is shown below.
**Ensure your comments match the following styles exactly or the code will not be stripped correctly**

### HTML

commenting style required: start comment - `<!--featureName v(semantic version)-->` and end comment - `<!--end featureName v(semantic version)-->`

exact matching with `vt({conditions:[{featureName:'1.2.3'}], exact:true})`:
```html
<!--featureName v(1.2.3)-->
<div>Part of featureName version 1.2.3</div>
<!--end featureName v(1.2.3)-->

<!--featureName v(2.2.3)-->
<div>Part of featureName version 2.2.3</div>
<!--end featureName v(2.2.3)-->
```

will result in
```html
<!--featureName v(1.2.3)-->
<div>Part of featureName version 1.2.3</div>
<!--end featureName v(1.2.3)-->
```

loose matching with `vt({conditions:[{featureName:'1.5.0'}]})`:
```html
<!--featureName v(1.2.3)-->
<div>Part of featureName version 1.2.3</div>
<!--end featureName v(1.2.3)-->

<!--featureName v(2.2.3)-->
<div>Part of featureName version 2.2.3</div>
<!--end featureName v(2.2.3)-->
```

will result in
```html
<!--featureName v(1.2.3)-->
<div>Part of featureName version 1.2.3</div>
<!--end featureName v(1.2.3)-->
```

### CSS

commenting style required: start comment - `/*featureName v(semantic version)*/` and end comment - `/*end featureName v(semantic version)*/`

exact matching with `vt({conditions:[{featureName:'1.2.3'}], exact:true})`:
```css
/*featureName v(1.2.3)*/
.background{
    color:red,
}
/*end featureName v(1.2.3)*/

/*featureName v(2.2.3)*/
.background{
    color:blue,
}
/*end featureName v(2.2.3)*/
```

will result in
```css
/*featureName v(1.2.3)*/
.background{
    color:red,
}
/*end featureName v(1.2.3)*/
```

loose matching with `vt({conditions:[{featureName:'1.5.0'}]})`:
```css
/*featureName v(1.2.3)*/
.background{
    color:red,
}
/*end featureName v(1.2.3)*/

/*featureName v(2.2.3)*/
.background{
    color:blue,
}
/*end featureName v(2.2.3)*/
```

will result in
```css
/*featureName v(1.2.3)*/
.background{
    color:red,
}
/*end featureName v(1.2.3)*/
```

### JS

commenting style required: start comment - `//featureName v(semantic version)` and end comment - `//end featureName v(semantic version)`

exact matching with `vt({conditions:[{featureName:'1.2.3'}], exact:true})`:
```js
//featureName v(1.2.3)
function featureName(){
    return 'version 1.2.3';
}
//end featureName v(1.2.3)

//featureName v(2.2.3)
function featureName(){
    return 'version 2.2.3';
}
//end featureName v(2.2.3)
```

will result in
```js
//featureName v(1.2.3)
function featureName(){
    return 'version 1.2.3';
}
//end featureName v(1.2.3)
```

loose matching with `vt({conditions:[{featureName:'1.5.0'}]})`:
```js
//featureName v(1.2.3)
function featureName(){
    return 'version 1.2.3';
}
//end featureName v(1.2.3)

//featureName v(2.2.3)
function featureName(){
    return 'version 2.2.3';
}
//end featureName v(2.2.3)
```

will result in
```js
//featureName v(1.2.3)
function featureName(){
    return 'version 1.2.3';
}
//end featureName v(1.2.3)
```

License
-------
MIT © BelleseTechnologies
