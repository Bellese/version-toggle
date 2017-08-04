Version-Toggle
==============

Overview
--------

Version-Toggle (VT) is used for facilitating front-end development with version toggling of code. This form of version toggling is to ensure that end-users will not receive any form of code other than the version specified by the publishing developer. VT works by parsing through all of the files of a project and removing code based on specific comments in place in **html**, **css** and **js** files.

Installation
------------
**This is currently not published yet. Will be published soon though. Until then, you cannot use the following command to install**
```sh
npm install version-toggle
```

Usage
-----

VT takes in 4 parameters:
1. conditions - an array of objects of the format `{featureName: 'semantic version'}` **REQUIRED**
2. exact - a boolean value marking that the user would like to exactly match against the versions passed in or not **optional - defaults to false**
3. inputDir - a string of the location to begin reading the files from **optional - defaults to src/**
4. outputDir - a string of the folder to place all of the newly stripped files **optional - defaults to ver/**

VT relies upon specific comments placed within the code to know what code to remove and what code to leave behind.
Examples of these comments and what the end result of having VT called on them is shown below.
**Ensure your comments match the following styles exactly or the code will not be stripped correctly**

### HTML

commenting style required: start comment - `<!--featureName v(semantic version)-->` and end comment - `<!--end featureName v(semantic version)-->`

exact matching with `vt({conditions:[{test:'1.2.3'}], exact:true})`:
```html
<!--test v(1.2.3)-->
<div>Part of test version 1.2.3</div>
<!--end test v(1.2.3)-->

<!--test v(2.2.3)-->
<div>Part of test version 2.2.3</div>
<!--end test v(2.2.3)-->
```

will result in
```html
<!--test v(1.2.3)-->
<div>Part of test version 1.2.3</div>
<!--end test v(1.2.3)-->
```

loose matching with `vt({conditions:[{test:'1.5.0'}]})`:
```html
<!--test v(1.2.3)-->
<div>Part of test version 1.2.3</div>
<!--end test v(1.2.3)-->

<!--test v(2.2.3)-->
<div>Part of test version 2.2.3</div>
<!--end test v(2.2.3)-->
```

will result in
```html
<!--test v(1.2.3)-->
<div>Part of test version 1.2.3</div>
<!--end test v(1.2.3)-->
```

### CSS

commenting style required: start comment - `/*featureName v(semantic version)*/` and end comment - `/*end featureName v(semantic version)*/`

exact matching with `vt({conditions:[{test:'1.2.3'}], exact:true})`:
```css
/*test v(1.2.3)*/
.background{
    color:red,
}
/*end test v(1.2.3)*/

/*test v(2.2.3)*/
.background{
    color:blue,
}
/*end test v(2.2.3)*/
```

will result in
```css
/*test v(1.2.3)*/
.background{
    color:red,
}
/*end test v(1.2.3)*/
```

loose matching with `vt({conditions:[{test:'1.5.0'}]})`:
```css
/*test v(1.2.3)*/
.background{
    color:red,
}
/*end test v(1.2.3)*/

/*test v(2.2.3)*/
.background{
    color:blue,
}
/*end test v(2.2.3)*/
```

will result in
```css
/*test v(1.2.3)*/
.background{
    color:red,
}
/*end test v(1.2.3)*/
```

### JS

commenting style required: start comment - `//featureName v(semantic version)` and end comment - `//end featureName v(semantic version)`

exact matching with `vt({conditions:[{test:'1.2.3'}], exact:true})`:
```js
//test v(1.2.3)
function test(){
    return 'version 1.2.3';
}
//end test v(1.2.3)

//test v(2.2.3)
function test(){
    return 'version 2.2.3';
}
//end test v(2.2.3)
```

will result in
```js
//test v(1.2.3)
function test(){
    return 'version 1.2.3';
}
//end test v(1.2.3)
```

loose matching with `vt({conditions:[{test:'1.5.0'}]})`:
```js
//test v(1.2.3)
function test(){
    return 'version 1.2.3';
}
//end test v(1.2.3)

//test v(2.2.3)
function test(){
    return 'version 2.2.3';
}
//end test v(2.2.3)
```

will result in
```js
//test v(1.2.3)
function test(){
    return 'version 1.2.3';
}
//end test v(1.2.3)
```

License
-------
MIT © BelleseTechnologies
