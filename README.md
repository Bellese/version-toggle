Version-Toggle
==============

Overview
--------

Version-Toggle (VT) is used for facilitating front-end development with version toggling of code. This form of version toggling is to ensure that end-users will not receive any form of code other than the version specified by the publishing developer. VT works by parsing through all of the files of a project and removing code based on specific comments in place in **html**, **css** and **js** files.

Installation
------------
```sh
npm install -g @bellese/version-toggle
```

Usage
-----
Once installed globally you will be able to use the command vt from your command prompt. See below for the different options you can set for the vt call.

VT has 5 different options that can be set:
1. `-c, --conditions` = a repeatable flag where you pass in a single condition of the format `-c featureName:x.x.x` or `--conditions featureName:x.x.x` where featureName is the name of the feature toggled and x.x.x is the semantic version you **want** to remain in the code. **optional**
2. `-l, --list` = an array of conditions that are comma seperated. The format to pass in a list is `-l featureName:x.x.x,anotherFeature:x.x.x` or `--list featureName:x.x.x` where featureName and anotherFeature are the names of the features being toggled and x.x.x is the semantic version of those features you **want** to remain in the code. **optional**

**IMPORTANT**
In order for vt to work, you must pass in at least one condition, whether trough -c or -l. If you do not provide any conditions, vt will return back with an error. Also, you can use -c and -l both at the same time, any conditions passed in through either of these options will be compiled together and passed into vt. For example: `vt -c hey:1.1.1 -l test:1.3.3,you:1.2.3` is valid and will pass all three conditions to vt. Lastly, the -c option can be used multiple times in a call. For example: `vt -c test:1.3.3 -c testing:1.3.3 -c hey:1.1.1` is a valid call and will pass in all three conditions to vt.

3. `-e, --exact` = a boolean value marking that the user would like to exactly match against the versions passed in or not. Format is `-e false` or `--exact true`. **optional - defaults to true**
4. `-i, --inputDir` = a string of the location to begin reading the files from. Format is `-i src/` or `--inputDir code/`. **optional - defaults to src/**
5. `-o, --outputDir` = a string of the folder to place all of the newly stripped files. Format is `-o out/` or `--outputDir versioned/` **optional - defaults to ver/**

**For help**
Use the command `vt -h`. This will print out a list of all options for vt and a description of what they do and how they are formatted.

VT relies upon specific comments placed within the code to know what code to remove and what code to leave behind.
Examples of these comments and what the end result of having VT called on them is shown below.
**Ensure your comments match the following styles exactly or the code will not be stripped correctly**

### HTML

commenting style required: start comment - `<!--featureName v(semantic version)-->` and end comment - `<!--end featureName v(semantic version)-->`

exact matching with command `vt -c featureName:1.2.3`:
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

loose matching with command `vt -c featureName:1.5.0 -e false`:
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

exact matching with command `vt -c featureName:1.2.3`:
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

loose matching with command `vt -c featureName:1.5.0 -e false`:
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

exact matching with command `vt -c featureName:1.2.3`:
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

loose matching with command `vt -c featureName:1.5.0 -e false`:
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
