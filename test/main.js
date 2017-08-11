'use strict';

var vt = require('../');
var fs = require('fs-extra');
var assert = require('assert');


describe('version-toggle', function() {

    var mdFile,
        htmlFile,
        cssFile,
        jsFile,
        spacesFile,
        wrappedFile,
        options;

    function readOutputAsText(name) {
        return fs.readFileSync('test/output/' + name);
    }

    describe('with exact version matching', function(done) {
        beforeEach(function(done) {
            options = { conditions: [{ test: '1.3.3' }], exact: true, inputDir: 'test/fixtures', outputDir: 'test/output' };
            vt(options).then(function() {
                mdFile = fs.readFileSync('test/fixtures/file-after-exact.md');
                htmlFile = fs.readFileSync('test/fixtures/file-after-exact.html');
                cssFile = fs.readFileSync('test/fixtures/file-after-exact.css');
                jsFile = fs.readFileSync('test/fixtures/file-after-exact.js');
                spacesFile = fs.readFileSync('test/fixtures/spaces-after-exact.js');
                done();
            });
        });

        // Cleans up the output folder after every test to ensure a clean test environment
        afterEach(function(done) {
            fs.remove('test/output').then(function() {
                done();
            });
        });

        it('should do nothing if file type is not js, css, or html', function() {
            var out = readOutputAsText('file-before-exact.md');
            assert.strictEqual(out.toString('utf8'), mdFile.toString('utf8'));
        });

        it('should remove code from html file when version is not matched exactly', function() {
            var out = readOutputAsText('file-before-exact.html');
            assert.strictEqual(out.toString('utf8'), htmlFile.toString('utf8'));
        });

        it('should remove code from css file when version is not matched exactly', function() {
            var out = readOutputAsText('file-before-exact.css');
            assert.strictEqual(out.toString('utf8'), cssFile.toString('utf8'));
        });

        it('should remove code from js file when version is not matched exactly', function() {
            var out = readOutputAsText('file-before-exact.js');
            assert.strictEqual(out.toString('utf8'), jsFile.toString('utf8'));
        });

        it('should allow space between commentStart/commendEnd and removal start/end tag', function() {
            var out = readOutputAsText('spaces-before-exact.js');
            assert.strictEqual(out.toString('utf8'), spacesFile.toString('utf8'));
        });
    });

    describe('with loose version matching', function() {
        beforeEach(function(done) {
            options = { conditions: [{ test: '1.3.3' }], exact: false, inputDir: 'test/fixtures', outputDir: 'test/output' };
            vt(options).then(function() {
                mdFile = fs.readFileSync('test/fixtures/file-after-loose.md');
                htmlFile = fs.readFileSync('test/fixtures/file-after-loose.html');
                cssFile = fs.readFileSync('test/fixtures/file-after-loose.css');
                jsFile = fs.readFileSync('test/fixtures/file-after-loose.js');
                spacesFile = fs.readFileSync('test/fixtures/spaces-after-loose.js');
                wrappedFile = fs.readFileSync('test/fixtures/file-after-wrapped.js');
                done();
            });
        });

        // Cleans up the output folder after every test to ensure a clean test environment
        afterEach(function(done) {
            fs.remove('test/output').then(function() {
                done();
            });
        });

        it('should do nothing if file type is not js, css, or html', function() {
            var out = readOutputAsText('file-before-loose.md');
            assert.strictEqual(out.toString('utf8'), mdFile.toString('utf8'));
        });

        it('should find latest version lower than provided and remove all other versions from html file', function() {
            var out = readOutputAsText('file-before-loose.html');
            assert.strictEqual(out.toString('utf8'), htmlFile.toString('utf8'));
        });

        it('should find latest version lower than provided and remove all other versions from css file', function() {
            var out = readOutputAsText('file-before-loose.css');
            assert.strictEqual(out.toString('utf8'), cssFile.toString('utf8'));
        });

        it('should find latest version lower than provided and remove all other versions from js file', function() {
            var out = readOutputAsText('file-before-loose.js');
            assert.strictEqual(out.toString('utf8'), jsFile.toString('utf8'));
        });

        it('should allow space between commentStart/commendEnd and removal start/end tag', function() {
            var out = readOutputAsText('spaces-before-loose.js');
            assert.strictEqual(out.toString('utf8'), spacesFile.toString('utf8'));
        });

        it('should remove all of the code from inside the comments even if the inner comments where of the correct version', function() {
            var out = readOutputAsText('file-before-wrapped.js');
            assert.strictEqual(out.toString('utf8'), wrappedFile.toString('utf8'));
        })
    });

    describe('with only a single file fed in', function() {
        beforeEach(function(done) {
            options = { conditions: [{ test: '1.3.3' }], exact: false, inputDir: 'test/fixtures/file-before-loose.js', outputDir: 'test/output/' };
            vt(options).then(function() {
                jsFile = fs.readFileSync('test/fixtures/file-after-loose.js');
                done();
            });
        });

        //Cleans up the output folder after every test to ensure a clean test environment
        afterEach(function(done) {
            fs.remove('test/output').then(function() {
                done();
            });
        });

        it('should find latest version lower than provided and remove all other versions from js file', function() {
            var out = readOutputAsText('file-before-loose.js');
            assert.strictEqual(out.toString('utf8'), jsFile.toString('utf8'));
        });
    });

    describe('with improperly formated comments', function() {
        //Cleans up the output folder after every test to ensure a clean test environment
        afterEach(function(done) {
            fs.remove('test/output').then(function() {
                done();
            });
        });

        it('should throw an error if no closing comment is found', function() {
            options = { conditions: [{ test: '1.3.3' }], exact: false, inputDir: 'test/broken-fixtures/missing-closing.js', outputDir: 'test/output/' };
            try {
                vt(options);
            } catch (err) {
                assert.deepEqual(err, "No closing comment found for test v(1.2.3)");
            }
        });

        it('should not change anything if a start comment is not found', function(done) {
            options = { conditions: [{ test: '1.3.3' }], exact: false, inputDir: 'test/broken-fixtures/missing-opening.js', outputDir: 'test/output/' };
            vt(options).then(function() {
                var out = fs.readFileSync('test/output/missing-opening.js');
                var input = fs.readFileSync('test/broken-fixtures/missing-opening.js');
                assert.strictEqual(out.toString('utf8'), input.toString('utf8'));
                //Need to call done to allow the files to be correctly read before they are deleted by the cleanup
                done();
            });
        });
    });

    describe('with improper command line parameters', function() {

        it('should not allow multiples of the same feature in conditions', function() {
            options = { conditions: [{ test: '1.3.3' }, { test: '1.2.2' }, { test: '1.0.0' }], exact: false, inputDir: 'test/fixtures', outputDir: 'test/output' };
            assert.throws(function() {
                vt(options);
            });
        });

        it('should not allow you to pass in no conditions', function() {
            options = { exact: false, inputDir: 'test/fixtures', outputDir: 'test/output' };
            assert.throws(function() {
                vt(options);
            })
        })

        it('should not allow you to pass in no options at all', function() {
            assert.throws(function() {
                vt();
            })
        })

        it('should not allow you to pass in null options', function() {
            assert.throws(function() {
                vt(null);
            })
        })

        it('should not allow you to pass in undefined options', function() {
            assert.throws(function() {
                vt(undefined);
            })
        })
    });
});