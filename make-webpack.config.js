'use strict';

let path = require('path')

let webpack = require('webpack')
let glob = require('glob')

let ExtractTextPlugin = require('extract-text-webpack-plugin')
let HtmlWebpackPlugin = require('html-webpack-plugin')
let autoprefixer = require('autoprefixer');

let UglifyJsPlugin = webpack.optimize.UglifyJsPlugin
let CommonsChunkPlugin = webpack.optimize.CommonsChunkPlugin

let srcDir = path.resolve(process.cwd(), 'src')
let nodeModPath = path.resolve(__dirname, './node_modules')
let assets = 'assets/'
let pathMap = require('./src/pathmap.json')

let entries = (() => {
    let jsDir = path.resolve(srcDir, 'js')
    let entryFiles = glob.sync(jsDir + '/*.js')
    let map = {}

    entryFiles.forEach((filePath) => {
        let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
        map[filename] = filePath
    })

    return map;
}())

module.exports = (options) => {
    options = options || {}

    let debug = options.debug !== undefined ? options.debug : true
    let cssLoader
    let scssLoader

    // generate entry html files
    // 自动生成入口文件，入口js名必须和入口文件名相同
    // 例如，a页的入口文件是a.html，那么在js目录下必须有一个a.js作为入口文件
    let plugins = () => {
        let entryHtml = glob.sync(srcDir + '/*.html')
        let r = []

        entryHtml.forEach((filePath) => {
            let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'))
            let conf = {
                template: 'html!' + filePath,
                filename: filename + '.html'
            }

            if(filename in entries) {
                conf.inject = 'body'
                conf.chunks = ['vender', filename]
                // conf.chunks = ['vender', 'common', filename]
            }

            if(/b|c/.test(filename)) conf.chunks.splice(2, 0, 'common-b-c')

            r.push(new HtmlWebpackPlugin(conf))
        })

        return r
    }()

    if(debug) {
        // 开发阶段，css直接内嵌
        cssLoader = 'style!css?sourceMap!postcss'
        scssLoader = 'style!css?sourceMap!postcss!sass?sourceMap'
    } else {
        // 编译阶段，css分离出来单独引入
        cssLoader = ExtractTextPlugin.extract('style', 'css?minimize!postcss') // enable minimize
        scssLoader = ExtractTextPlugin.extract('style', 'css?minimize!postcss!sass')

        plugins.push(
            new ExtractTextPlugin('css/[contenthash:8].[name].min.css', {
                // 当allChunks指定为false时，css loader必须指定怎么处理
                // additional chunk所依赖的css，即指定`ExtractTextPlugin.extract()`
                // 第一个参数`notExtractLoader`，一般是使用style-loader
                // @see https://github.com/webpack/extract-text-webpack-plugin
                allChunks: false
            })
        )

        plugins.push(new UglifyJsPlugin())
    }

    let config = {
        entry: Object.assign(entries, {
            // 'vender': ['zepto']
        }),

        output: {
            path: path.resolve(assets),
            filename: debug ? '[name].js' : 'js/[chunkhash:8].[name].min.js',
            chunkFilename: debug ? '[chunkhash:8].chunk.js' : 'js/[chunkhash:8].chunk.min.js',
            hotUpdateChunkFilename: debug ? '[id].js' : 'js/[id].[chunkhash:8].min.js',
        },

        resolve: {
            root: [srcDir, './node_modules'],
            alias: pathMap,
            extensions: ['', '.js', '.css', '.scss', '.tpl', '.png', '.jpg']
        },

        resolveLoader: {
            root: path.join(__dirname, 'node_modules')
        },

        module: {
            loaders: [
                {
                    test: /\.(jpe?g|png|gif|svg)$/i,
                    loaders: [
                        'url?limit=10000&name=img/[hash:8].[name].[ext]',
                    ]
                },
                {
                    test: /\.(woff|eot|ttf)$/i,
                    loader: 'url?limit=10000&name=fonts/[hash:8].[name].[ext]'
                },
                {test: /\.css$/, loader: cssLoader},
                {test: /\.scss$/, loader: scssLoader},
                {test: /\.js$/, exclude: /node_modules/, loader: 'babel?presets[]=es2015'}
            ]
        },

        plugins: [
            // new CommonsChunkPlugin({
            //     name: 'common-b-c',
            //     chunks: ['b', 'c']
            // }),
            // new CommonsChunkPlugin({
            //     name: 'common',
            //     chunks: ['common-b-c', 'a']
            // }),
            // new CommonsChunkPlugin({
            //     name: 'vender',
            //     chunks: ['common']
            // })
        ].concat(plugins),

        // postcss-loader配置
        postcss: [ autoprefixer({ browsers: ['last 3 versions'] }) ],

        devServer: {
            hot: true,
            noInfo: false,
            inline: true,
            stats: {
                cached: false,
                colors: true
            }
        }
    }

    if (debug) {
        // 为实现webpack-hot-middleware做相关配置
        // @see https://github.com/glenjamin/webpack-hot-middleware
        ((entry) => {
            for  (let key of Object.keys(entry)) {
                if (! Array.isArray(entry[key])) {
                    entry[key] = Array.of(entry[key])
                }
                entry[key].push('webpack-hot-middleware/client?reload=true')
            }
        })(config.entry)

        config.plugins.push( new webpack.HotModuleReplacementPlugin() )
        config.plugins.push( new webpack.NoErrorsPlugin() )

        config.devtool = 'source-map'
    }

    return config
}
