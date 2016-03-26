'use strict';

const fs = require('fs');

const render = require('koa-ejs');

module.exports = (router, app, staticDir) => {
    render(app, {
        root: __dirname,
        layout: false,
        viewExt: 'html',
        cache: false,
        debug: true
    });

    router.get('/', function*() {
        let pages = fs.readdirSync(staticDir);

        pages = pages.filter((page) => {
            return /\.html$/.test(page);
        });

        yield this.render('home', {pages: pages || []});
    });
};
